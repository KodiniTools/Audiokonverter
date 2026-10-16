/**
 * WasmAudioService: Laden des selbst gehosteten FFmpeg-Kerns und Timeout der
 * lokalen Konvertierung abhängig von der Eingabedauer. @ffmpeg/ffmpeg und
 * @ffmpeg/util sind gemockt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ffmpegMock = vi.hoisted(() => {
  class FakeFFmpeg {
    handlers: Record<string, (event: { message?: string; progress?: number }) => void> = {}
    load = vi.fn(async () => true)
    exec = vi.fn((): Promise<number> => ffmpegMock.execImpl())
    writeFile = vi.fn(async () => true)
    readFile = vi.fn(async () => new Uint8Array([1, 2, 3]))
    deleteFile = vi.fn(async () => true)
    terminate = vi.fn()

    constructor() {
      ffmpegMock.instances.push(this)
    }

    on(event: string, handler: (event: { message?: string; progress?: number }) => void): void {
      this.handlers[event] = handler
    }

    emitLog(message: string): void {
      this.handlers.log?.({ message })
    }
  }
  return {
    FakeFFmpeg,
    instances: [] as FakeFFmpeg[],
    // Standard: FFmpeg rechnet, bis der Test etwas anderes vorgibt
    execImpl: (): Promise<number> => new Promise<number>(() => {}),
  }
})

vi.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: ffmpegMock.FakeFFmpeg }))
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(async () => new Uint8Array(4)),
  toBlobURL: vi.fn(async (url: string) => `blob:${url}`),
}))

/** Frisches Modul je Test, damit der geladene Kern nicht zwischen Tests geteilt wird. */
async function loadService() {
  vi.resetModules()
  return import('@/services/WasmAudioService')
}

function audioFile(): File {
  return new File([new Uint8Array(16)], 'song.wav', { type: 'audio/wav' })
}

beforeEach(() => {
  ffmpegMock.instances.length = 0
  ffmpegMock.execImpl = () => new Promise<number>(() => {})
})

afterEach(() => {
  vi.useRealTimers()
})

describe('parseDurationSeconds', () => {
  it.each<[string, number | null]>([
    ['  Duration: 00:03:25.12, start: 0.000000, bitrate: 1411 kb/s', 205.12],
    ['  Duration: 01:00:00.00, start: 0.000000', 3600],
    ['  Duration: N/A, start: 0.000000, bitrate: N/A', null],
    ['Stream #0:0: Audio: pcm_s16le', null],
  ])('%s → %s', async (line, expected) => {
    const { parseDurationSeconds } = await loadService()
    const result = parseDurationSeconds(line)
    if (expected === null) expect(result).toBeNull()
    else expect(result).toBeCloseTo(expected, 5)
  })
})

describe('execTimeoutFor', () => {
  it('nutzt ohne bekannte Dauer die Grundzeit von 2 Minuten', async () => {
    const { execTimeoutFor } = await loadService()
    expect(execTimeoutFor(null)).toBe(120_000)
    expect(execTimeoutFor(0)).toBe(120_000)
    expect(execTimeoutFor(Number.NaN)).toBe(120_000)
  })

  it('addiert die Eingabedauer in Echtzeit zur Grundzeit', async () => {
    const { execTimeoutFor } = await loadService()
    expect(execTimeoutFor(600)).toBe(720_000)
    expect(execTimeoutFor(0.5)).toBe(120_500)
  })

  it('begrenzt den Timeout auf 30 Minuten', async () => {
    const { execTimeoutFor } = await loadService()
    expect(execTimeoutFor(10 * 3600)).toBe(30 * 60 * 1000)
  })
})

describe('loadFFmpeg', () => {
  it('lädt den Kern vom eigenen Server statt von unpkg.com', async () => {
    const util = await import('@ffmpeg/util')
    const { loadFFmpeg } = await loadService()
    const { FFMPEG_CORE_DIR } = await import('@/config/ffmpegCore')

    await loadFFmpeg()

    const urls = vi.mocked(util.toBlobURL).mock.calls.map(([url]) => url)
    expect(urls).toEqual([
      `${location.origin}/${FFMPEG_CORE_DIR}/ffmpeg-core.js`,
      `${location.origin}/${FFMPEG_CORE_DIR}/ffmpeg-core.wasm`,
    ])
    expect(urls.some((url) => url.includes('unpkg.com'))).toBe(false)
  })
})

describe('convertLocally – Timeout', () => {
  it('liefert das Ergebnis, wenn FFmpeg rechtzeitig fertig wird', async () => {
    ffmpegMock.execImpl = async () => 0
    const { convertLocally } = await loadService()

    const blob = await convertLocally(audioFile(), 'mp3', 7)

    expect(blob.size).toBe(3)
    expect(blob.type).toBe('audio/mpeg')
    expect(ffmpegMock.instances[0].terminate).not.toHaveBeenCalled()
    expect(ffmpegMock.instances[0].deleteFile).toHaveBeenCalledTimes(2)
  })

  it('bricht ohne gemeldete Dauer nach 2 Minuten ab und beendet den Worker', async () => {
    vi.useFakeTimers()
    const { convertLocally } = await loadService()

    const result = convertLocally(audioFile(), 'mp3', 7)
    const assertion = expect(result).rejects.toThrow('wasm_exec_timeout')
    await vi.advanceTimersByTimeAsync(119_999)
    expect(ffmpegMock.instances[0].terminate).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await assertion
    expect(ffmpegMock.instances[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('verlängert den Timeout, sobald FFmpeg die Eingabedauer meldet', async () => {
    vi.useFakeTimers()
    const { convertLocally } = await loadService()

    const result = convertLocally(audioFile(), 'mp3', 7)
    let settled = false
    result.catch(() => {}).finally(() => (settled = true))
    await vi.advanceTimersByTimeAsync(0)
    const instance = ffmpegMock.instances[0]
    expect(instance.exec).toHaveBeenCalledTimes(1)

    // 10 Minuten Audio → 2 min + 10 min = 12 min ab der Meldung
    instance.emitLog('  Duration: 00:10:00.00, start: 0.000000, bitrate: 1411 kb/s')
    // Eine zweite Dauer-Zeile (z. B. vom Ausgang) verschiebt den Timeout nicht erneut
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    instance.emitLog('  Duration: 00:10:00.00')

    await vi.advanceTimersByTimeAsync(7 * 60_000 - 1)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(result).rejects.toThrow('wasm_exec_timeout')
    expect(instance.terminate).toHaveBeenCalledTimes(1)
  })
})
