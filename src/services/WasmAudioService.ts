import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { AudioFormat } from '@/types'
import { FFMPEG_CORE_DIR } from '@/config/ffmpegCore'

const WASM_THRESHOLD = 20 * 1024 * 1024 // 20MB
const LOAD_TIMEOUT = 30000 // 30s für das Laden des Kerns
// Konvertierungs-Timeout: Grundzeit plus einmal die Eingabedauer (Echtzeit),
// begrenzt nach oben. Die Dauer kommt aus dem FFmpeg-Log ("Duration: …").
const EXEC_TIMEOUT_BASE = 120000 // 2 min
const EXEC_TIMEOUT_MAX = 30 * 60 * 1000 // 30 min

let ffmpeg: FFmpeg | null = null
let loaded = false
let loading = false
let currentProgressHandler: ((progress: number) => void) | null = null
let currentLogHandler: ((message: string) => void) | null = null
let cachedCoreURL: string | null = null
let cachedWasmURL: string | null = null

export function shouldProcessLocally(file: File): boolean {
  return file.size <= WASM_THRESHOLD
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(msg)), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (loaded && ffmpeg) return ffmpeg

  if (loading) {
    const deadline = Date.now() + LOAD_TIMEOUT
    while (loading) {
      if (Date.now() > deadline) throw new Error('wasm_load_timeout')
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (loaded && ffmpeg) return ffmpeg
  }

  loading = true
  try {
    ffmpeg = new FFmpeg()

    ffmpeg.on('progress', ({ progress }) => {
      currentProgressHandler?.(Math.round(progress * 100))
    })
    ffmpeg.on('log', ({ message }) => {
      currentLogHandler?.(message)
    })

    // Selbst gehostet (siehe src/config/ffmpegCore.ts), absolut zur Seite,
    // weil toBlobURL die Datei per fetch lädt.
    const baseURL = new URL(`${import.meta.env.BASE_URL}${FFMPEG_CORE_DIR}`, location.href).href

    if (!cachedCoreURL) {
      cachedCoreURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        LOAD_TIMEOUT,
        'wasm_core_fetch_timeout'
      )
    }
    if (!cachedWasmURL) {
      cachedWasmURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        LOAD_TIMEOUT,
        'wasm_binary_fetch_timeout'
      )
    }

    await withTimeout(
      ffmpeg.load({ coreURL: cachedCoreURL, wasmURL: cachedWasmURL }),
      LOAD_TIMEOUT,
      'wasm_init_timeout'
    )

    loaded = true
    return ffmpeg
  } catch (e) {
    ffmpeg = null
    loaded = false
    throw e
  } finally {
    loading = false
  }
}

export function setProgressHandler(handler: ((progress: number) => void) | null): void {
  currentProgressHandler = handler
}

/**
 * Bricht eine laufende lokale Konvertierung sofort ab, indem der FFmpeg-Worker
 * beendet wird. Die laufende `exec()`-Promise wird dadurch verworfen. Der interne
 * Zustand wird zurückgesetzt, sodass die nächste Konvertierung FFmpeg neu lädt
 * (die bereits geladenen Core-/WASM-Blobs bleiben zwischengespeichert).
 */
export function terminateFFmpeg(): void {
  if (ffmpeg) {
    try {
      ffmpeg.terminate()
    } catch {
      // Worker bereits beendet – ignorieren
    }
  }
  ffmpeg = null
  loaded = false
  loading = false
  currentProgressHandler = null
  currentLogHandler = null
}

/** Liest die Eingabedauer in Sekunden aus einer FFmpeg-Logzeile wie "Duration: 00:03:25.12, …". */
export function parseDurationSeconds(message: string): number | null {
  const match = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(message)
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

/** Timeout für die Konvertierung: Grundzeit plus Eingabedauer, begrenzt auf EXEC_TIMEOUT_MAX. */
export function execTimeoutFor(durationSeconds: number | null): number {
  if (durationSeconds === null || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return EXEC_TIMEOUT_BASE
  }
  return Math.min(EXEC_TIMEOUT_MAX, EXEC_TIMEOUT_BASE + Math.ceil(durationSeconds * 1000))
}

export function buildFFmpegArgs(
  inputName: string,
  outputName: string,
  format: AudioFormat,
  quality: number
): string[] {
  const args = ['-y', '-i', inputName]
  // WebM ist ein Video-Container: Videospur verwerfen, sonst versuchen
  // Zielcontainer wie OGG/M4A sie mitzukodieren.
  if (isWebmName(inputName)) args.push('-vn')

  switch (format) {
    case 'mp3': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      args.push('-codec:a', 'libmp3lame', '-b:a', `${bitrates[quality - 1] ?? 192}k`)
      break
    }
    case 'aac':
    case 'm4a': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      args.push('-codec:a', 'aac', '-b:a', `${bitrates[quality - 1] ?? 192}k`)
      break
    }
    case 'ogg':
      args.push('-codec:a', 'libvorbis', '-q:a', `${quality}`)
      break
    case 'flac': {
      const level = Math.min(8, Math.max(0, quality - 2))
      args.push('-codec:a', 'flac', '-compression_level', `${level}`)
      break
    }
    case 'wav': {
      const codec = quality <= 4 ? 'pcm_s16le' : quality <= 7 ? 'pcm_s24le' : 'pcm_f32le'
      args.push('-codec:a', codec)
      break
    }
    case 'opus': {
      const bitrates = [32, 48, 64, 96, 128, 160, 192, 256, 320, 510]
      args.push('-codec:a', 'libopus', '-b:a', `${bitrates[quality - 1] ?? 128}k`)
      break
    }
    case 'aiff': {
      const codec = quality <= 4 ? 'pcm_s16be' : quality <= 7 ? 'pcm_s24be' : 'pcm_s32be'
      args.push('-codec:a', codec)
      break
    }
    case 'wma': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      args.push('-codec:a', 'wmav2', '-b:a', `${bitrates[quality - 1] ?? 192}k`)
      break
    }
  }

  args.push(outputName)
  return args
}

/** Eingabe ist ein WebM-Container (Audio oder Video). */
export function isWebmName(name: string): boolean {
  return /\.(webm|weba)$/i.test(name)
}

const MIME_TYPES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
  aiff: 'audio/aiff',
  wma: 'audio/x-ms-wma',
}

/**
 * Führt FFmpeg aus. Startet mit dem Grund-Timeout und verlängert ihn einmalig,
 * sobald FFmpeg die Eingabedauer meldet. Bei Timeout wird der Worker beendet,
 * damit er nicht im Hintergrund weiterrechnet; der nächste Aufruf lädt neu.
 */
async function execWithDurationTimeout(instance: FFmpeg, args: string[]): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let rejectTimeout: (error: Error) => void = () => {}
  const timeout = new Promise<never>((_, reject) => {
    rejectTimeout = reject
  })
  const arm = (ms: number): void => {
    clearTimeout(timer)
    timer = setTimeout(() => rejectTimeout(new Error('wasm_exec_timeout')), ms)
  }

  let durationKnown = false
  currentLogHandler = (message) => {
    if (durationKnown) return
    const duration = parseDurationSeconds(message)
    if (duration === null) return
    durationKnown = true
    arm(execTimeoutFor(duration))
  }
  arm(execTimeoutFor(null))

  try {
    await Promise.race([instance.exec(args), timeout])
  } catch (error) {
    if ((error as Error)?.message === 'wasm_exec_timeout') terminateFFmpeg()
    throw error
  } finally {
    clearTimeout(timer)
    currentLogHandler = null
  }
}

export async function convertLocally(
  file: File,
  targetFormat: AudioFormat,
  quality: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const instance = await loadFFmpeg()

  setProgressHandler(onProgress ?? null)

  const inputExt = file.name.split('.').pop() ?? 'mp3'
  const inputName = `input.${inputExt}`
  const outputName = `output.${targetFormat}`

  try {
    await instance.writeFile(inputName, await fetchFile(file))

    const args = buildFFmpegArgs(inputName, outputName, targetFormat, quality)
    await execWithDurationTimeout(instance, args)

    const data = (await instance.readFile(outputName)) as Uint8Array
    if (!data || data.length === 0) throw new Error('wasm_empty_output')

    return new Blob([data.buffer as ArrayBuffer], { type: MIME_TYPES[targetFormat] })
  } finally {
    setProgressHandler(null)
    try {
      await instance.deleteFile(inputName)
    } catch {}
    try {
      await instance.deleteFile(outputName)
    } catch {}
  }
}
