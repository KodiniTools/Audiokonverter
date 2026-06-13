import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { AudioFormat } from '@/types'

const WASM_THRESHOLD = 20 * 1024 * 1024 // 20MB
const LOAD_TIMEOUT = 30000 // 30s für CDN-Load
const EXEC_TIMEOUT = 120000 // 2min für Konvertierung

let ffmpeg: FFmpeg | null = null
let loaded = false
let loading = false
let currentProgressHandler: ((progress: number) => void) | null = null
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

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

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

function buildFFmpegArgs(
  inputName: string,
  outputName: string,
  format: AudioFormat,
  quality: number
): string[] {
  const args = ['-y', '-i', inputName]

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
    await withTimeout(instance.exec(args), EXEC_TIMEOUT, 'wasm_exec_timeout')

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
