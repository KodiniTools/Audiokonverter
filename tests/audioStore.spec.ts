/**
 * audioStore: Konvertierung über Server und lokal (FFmpeg.wasm), Fehler,
 * Abbruch und Fallback. axios und WasmAudioService sind gemockt.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import * as wasm from '@/services/WasmAudioService'
import { useAudioStore } from '@/stores/audioStore'
import { audioFile, byId, flush, pendingUntilAborted, serverOk } from './storeTestUtils'

vi.mock('axios', () => ({
  default: { post: vi.fn(), isCancel: vi.fn() },
}))

vi.mock('@/services/WasmAudioService', () => ({
  shouldProcessLocally: vi.fn(),
  convertLocally: vi.fn(),
  loadFFmpeg: vi.fn(),
  terminateFFmpeg: vi.fn(),
}))

const post = vi.mocked(axios.post)
const isCancel = vi.mocked(axios.isCancel)
const shouldProcessLocally = vi.mocked(wasm.shouldProcessLocally)
const convertLocally = vi.mocked(wasm.convertLocally)
const loadFFmpeg = vi.mocked(wasm.loadFFmpeg)
const terminateFFmpeg = vi.mocked(wasm.terminateFFmpeg)

/** Liefert die Optionen (u. a. signal) des letzten axios.post-Aufrufs. */
function lastPostSignal(): AbortSignal | undefined {
  const config = post.mock.lastCall?.[2] as { signal?: AbortSignal } | undefined
  return config?.signal
}

/** Store, dessen Dateien lokal (FFmpeg.wasm) oder auf dem Server verarbeitet werden. */
function createStore(local: boolean) {
  shouldProcessLocally.mockReturnValue(local)
  return useAudioStore()
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())

  post.mockReset()
  isCancel.mockReset().mockReturnValue(false)
  shouldProcessLocally.mockReset().mockReturnValue(false)
  convertLocally.mockReset()
  loadFFmpeg.mockReset().mockResolvedValue({} as Awaited<ReturnType<typeof wasm.loadFFmpeg>>)
  terminateFFmpeg.mockReset()

  // jsdom kennt keine Blob-URLs
  URL.createObjectURL = vi.fn(() => 'blob:converted')
  URL.revokeObjectURL = vi.fn()
})

describe('audioStore – Server-Konvertierung', () => {
  it('markiert die Datei nach Erfolg als fertig und setzt Name, URL und Größe', async () => {
    const store = createStore(false)
    post.mockResolvedValue(serverOk('song-abc123.mp3', 4321))
    const [file] = store.addFiles([audioFile('song.wav')])

    const result = await store.convertAllFiles()

    expect(result).toEqual({ cancelled: false })
    const converted = byId(store.audioFiles, file.id)
    expect(converted.status).toBe('completed')
    expect(converted.progress).toBe(100)
    expect(converted.convertedUrl).toBe('/audiokonverter/files/song-abc123.mp3')
    expect(converted.convertedName).toBe('song.mp3')
    expect(converted.convertedFormat).toBe('MP3')
    expect(converted.convertedSize).toBe(4321)
    expect(converted.processedLocally).toBe(false)
    expect(store.convertedFiles).toHaveLength(1)
    expect(store.isConverting).toBe(false)
  })

  it('schickt Datei, Format und Qualität als FormData an /audiokonverter/api/convert', async () => {
    const store = createStore(false)
    post.mockResolvedValue(serverOk())
    store.setFormat('flac')
    store.setQuality(9)
    store.addFiles([audioFile('song.wav')])

    await store.convertAllFiles()

    expect(post).toHaveBeenCalledTimes(1)
    const [url, body] = post.mock.calls[0]
    expect(url).toBe('/audiokonverter/api/convert')
    const form = body as FormData
    expect(form.get('format')).toBe('flac')
    expect(form.get('quality')).toBe('9')
    expect((form.get('file') as File).name).toBe('song.wav')
  })

  it('übernimmt bei einem Server-Fehler die Fehlermeldung des Backends', async () => {
    const store = createStore(false)
    post.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 400'), {
        response: { data: { ok: false, error: 'bad_format' } },
      })
    )
    const [file] = store.addFiles([audioFile()])

    const result = await store.convertAllFiles()

    expect(result).toEqual({ cancelled: false })
    const failed = byId(store.audioFiles, file.id)
    expect(failed.status).toBe('error')
    expect(failed.error).toBe('bad_format')
    expect(failed.progress).toBe(0)
    expect(store.convertedFiles).toHaveLength(0)
    expect(store.isConverting).toBe(false)
  })

  it('wertet eine Antwort mit ok: false als Fehler', async () => {
    const store = createStore(false)
    post.mockResolvedValue({ data: { ok: false, error: 'no_input' } })
    const [file] = store.addFiles([audioFile()])

    await store.convertAllFiles()

    const failed = byId(store.audioFiles, file.id)
    expect(failed.status).toBe('error')
    expect(failed.error).toBe('no_input')
  })

  it('wertet eine Antwort ohne url als Fehler', async () => {
    const store = createStore(false)
    post.mockResolvedValue({ data: { ok: true, filename: 'x.mp3' } })
    const [file] = store.addFiles([audioFile()])

    await store.convertAllFiles()

    const failed = byId(store.audioFiles, file.id)
    expect(failed.status).toBe('error')
    expect(failed.error).toContain('url fehlt')
  })

  it('versucht fehlgeschlagene Dateien beim nächsten Lauf erneut', async () => {
    const store = createStore(false)
    post.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(serverOk())
    const [file] = store.addFiles([audioFile()])

    await store.convertAllFiles()
    expect(store.audioFiles[0].status).toBe('error')

    await store.convertAllFiles()
    const retried = byId(store.audioFiles, file.id)
    expect(retried.status).toBe('completed')
    expect(store.convertedFiles).toHaveLength(1)
  })
})

describe('audioStore – Abbruch', () => {
  it('setzt die laufende Datei auf pending zurück und lässt weitere Dateien unangetastet', async () => {
    const store = createStore(false)
    post.mockImplementation((_url, _body, config) =>
      pendingUntilAborted((config as { signal?: AbortSignal }).signal)
    )
    const [first, second] = store.addFiles([audioFile('a.wav'), audioFile('b.wav')])

    const run = store.convertAllFiles()
    await flush()
    expect(store.isConverting).toBe(true)
    expect(byId(store.audioFiles, first.id).status).toBe('converting')

    store.cancelConversion()
    expect(store.isCancelling).toBe(true)
    expect(lastPostSignal()?.aborted).toBe(true)

    const result = await run

    expect(result).toEqual({ cancelled: true })
    expect(post).toHaveBeenCalledTimes(1)
    for (const id of [first.id, second.id]) {
      const f = byId(store.audioFiles, id)
      expect(f.status).toBe('pending')
      expect(f.progress).toBe(0)
      expect(f.error).toBeNull()
    }
    expect(store.audioFiles).toHaveLength(2)
    expect(store.conversionProgress[first.id]).toBeUndefined()
    expect(store.isConverting).toBe(false)
    expect(store.isCancelling).toBe(false)
    expect(terminateFFmpeg).toHaveBeenCalledTimes(1)
  })

  it('behält bereits fertige Dateien beim Abbruch', async () => {
    const store = createStore(false)
    post
      .mockResolvedValueOnce(serverOk('a-1.mp3'))
      .mockImplementationOnce((_url, _body, config) =>
        pendingUntilAborted((config as { signal?: AbortSignal }).signal)
      )
    const [first, second] = store.addFiles([audioFile('a.wav'), audioFile('b.wav')])

    const run = store.convertAllFiles()
    await flush()
    store.cancelConversion()
    await run

    expect(byId(store.audioFiles, first.id).status).toBe('completed')
    expect(byId(store.audioFiles, second.id).status).toBe('pending')
    expect(store.convertedFiles).toHaveLength(1)
  })

  it('tut nichts, wenn keine Konvertierung läuft', () => {
    const store = useAudioStore()
    store.cancelConversion()
    expect(store.isCancelling).toBe(false)
    expect(terminateFFmpeg).not.toHaveBeenCalled()
  })
})

describe('audioStore – lokale Konvertierung (FFmpeg.wasm)', () => {
  it('lädt FFmpeg.wasm vor, sobald eine lokal verarbeitbare Datei hinzukommt', async () => {
    const store = createStore(true)
    store.addFiles([audioFile()])
    expect(store.wasmLoading).toBe(true)

    await flush()

    expect(loadFFmpeg).toHaveBeenCalledTimes(1)
    expect(store.wasmReady).toBe(true)
    expect(store.wasmLoading).toBe(false)
  })

  it('konvertiert lokal, wenn WASM bereit ist, ohne den Server aufzurufen', async () => {
    const store = createStore(true)
    convertLocally.mockResolvedValue(new Blob([new Uint8Array(42)], { type: 'audio/mpeg' }))
    const [file] = store.addFiles([audioFile('song.wav')])
    await flush()

    await store.convertAllFiles()

    expect(post).not.toHaveBeenCalled()
    expect(convertLocally).toHaveBeenCalledWith(file.file, 'mp3', 7, expect.any(Function))
    const converted = byId(store.audioFiles, file.id)
    expect(converted.status).toBe('completed')
    expect(converted.convertedUrl).toBe('blob:converted')
    expect(converted.convertedSize).toBe(42)
    expect(converted.processedLocally).toBe(true)
  })

  it('fällt bei einem WASM-Fehler auf den Server zurück', async () => {
    const store = createStore(true)
    convertLocally.mockRejectedValue(new Error('wasm_exec_timeout'))
    post.mockResolvedValue(serverOk())
    const [file] = store.addFiles([audioFile()])
    await flush()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await store.convertAllFiles()

    expect(convertLocally).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledTimes(1)
    const converted = byId(store.audioFiles, file.id)
    expect(converted.status).toBe('completed')
    expect(converted.processedLocally).toBe(false)
    expect(warn).toHaveBeenCalled()
  })

  it('nutzt den Server, wenn FFmpeg.wasm nicht geladen werden konnte', async () => {
    const store = createStore(true)
    loadFFmpeg.mockRejectedValue(new Error('wasm_load_timeout'))
    post.mockResolvedValue(serverOk())
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    store.addFiles([audioFile()])
    await flush()

    expect(store.wasmReady).toBe(false)
    await store.convertAllFiles()

    expect(convertLocally).not.toHaveBeenCalled()
    expect(post).toHaveBeenCalledTimes(1)
    expect(store.audioFiles[0].status).toBe('completed')
  })

  it('weicht beim Abbruch nicht auf den Server aus und setzt die Datei auf pending', async () => {
    const store = createStore(true)
    // terminateFFmpeg beendet den Worker – die laufende Konvertierung schlägt fehl
    let rejectLocal: (e: Error) => void = () => {}
    convertLocally.mockImplementation(
      () => new Promise<Blob>((_, reject) => (rejectLocal = reject))
    )
    terminateFFmpeg.mockImplementation(() => rejectLocal(new Error('terminated')))
    const [file] = store.addFiles([audioFile()])
    await flush()

    const run = store.convertAllFiles()
    await flush()
    store.cancelConversion()
    const result = await run

    expect(result).toEqual({ cancelled: true })
    expect(post).not.toHaveBeenCalled()
    const f = byId(store.audioFiles, file.id)
    expect(f.status).toBe('pending')
    expect(f.progress).toBe(0)
  })
})

describe('audioStore – Einstellungen und Dateiliste', () => {
  it('speichert Format und Qualität in localStorage', async () => {
    const store = useAudioStore()
    store.setFormat('opus')
    store.setQuality(3)
    await flush()

    expect(JSON.parse(localStorage.getItem('audiokonverter_settings') ?? '{}')).toEqual({
      format: 'opus',
      quality: 3,
    })
  })

  it('entfernt einzelne Dateien und leert die Liste vollständig', () => {
    const store = useAudioStore()
    const [a] = store.addFiles([audioFile('a.wav'), audioFile('b.wav')])
    expect(store.fileCount).toBe(2)
    expect(store.totalSize).toBe(32)

    store.removeFile(a.id)
    expect(store.fileCount).toBe(1)
    expect(store.audioFiles[0].name).toBe('b.wav')

    store.clearAllFiles()
    expect(store.hasFiles).toBe(false)
    expect(store.hasConvertedFiles).toBe(false)
  })
})

describe('audioStore – Blob-URLs freigeben', () => {
  /** Konvertiert die Dateien lokal; jede bekommt eine eigene Blob-URL. */
  async function convertLocallyAll(names: string[]) {
    const store = createStore(true)
    let n = 0
    URL.createObjectURL = vi.fn(() => `blob:converted-${++n}`)
    convertLocally.mockResolvedValue(new Blob([new Uint8Array(8)], { type: 'audio/mpeg' }))
    const files = store.addFiles(names.map((name) => audioFile(name)))
    await flush()
    await store.convertAllFiles()
    return { store, files }
  }

  it('gibt beim Entfernen die Blob-URL der Datei frei, nicht die der anderen', async () => {
    const { store, files } = await convertLocallyAll(['a.wav', 'b.wav'])
    expect(store.convertedFiles).toHaveLength(2)

    store.removeFile(files[0].id)

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:converted-1')
    expect(store.convertedFiles.map((f) => f.id)).toEqual([files[1].id])
    expect(byId(store.audioFiles, files[1].id).convertedUrl).toBe('blob:converted-2')
  })

  it('gibt beim Leeren alle Blob-URLs frei', async () => {
    const { store } = await convertLocallyAll(['a.wav', 'b.wav'])

    store.clearAllFiles()

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:converted-1')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:converted-2')
  })

  it('lässt Server-Ergebnisse unangetastet (keine Blob-URL)', async () => {
    const store = createStore(false)
    post.mockResolvedValue(serverOk())
    const [file] = store.addFiles([audioFile()])
    await store.convertAllFiles()

    store.removeFile(file.id)
    store.clearAllFiles()

    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(store.hasConvertedFiles).toBe(false)
  })

  it('ignoriert unbekannte IDs', () => {
    const store = useAudioStore()
    store.addFiles([audioFile()])

    store.removeFile('gibt-es-nicht')

    expect(store.fileCount).toBe(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
