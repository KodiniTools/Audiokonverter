import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const WASM_THRESHOLD = 20 * 1024 * 1024 // 20MB
const LOAD_TIMEOUT = 15000 // 15s for loading WASM from CDN
const EXEC_TIMEOUT = 120000 // 2min for conversion

let ffmpeg = null
let loaded = false
let loading = false
let currentProgressHandler = null
let cachedCoreURL = null
let cachedWasmURL = null

/**
 * Determines whether a file should be processed locally via WebAssembly.
 * Files under 20MB are processed in the browser; larger files go to the server.
 */
export function shouldProcessLocally(file) {
  return file.size <= WASM_THRESHOLD
}

/**
 * Race a promise against a timeout. Rejects with the given message on timeout.
 */
function withTimeout(promise, ms, msg) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(msg)), ms)
    })
  ]).finally(() => clearTimeout(timer))
}

/**
 * Initializes FFmpeg.wasm (v0.12+ API). Loads core + wasm from CDN as blob URLs
 * to avoid CORS/SharedArrayBuffer issues. All steps are guarded by timeouts.
 */
export async function loadFFmpeg() {
  if (loaded) return ffmpeg

  if (loading) {
    // Another call is already loading — wait with a deadline
    const deadline = Date.now() + LOAD_TIMEOUT
    while (loading) {
      if (Date.now() > deadline) throw new Error('wasm_load_timeout')
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    // The other caller finished — check if it succeeded
    if (loaded) return ffmpeg
    // It failed; fall through to try ourselves
  }

  loading = true
  try {
    ffmpeg = new FFmpeg()

    ffmpeg.on('progress', ({ progress }) => {
      if (currentProgressHandler) {
        currentProgressHandler(Math.round(progress * 100))
      }
    })

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

    if (!cachedCoreURL) {
      cachedCoreURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        LOAD_TIMEOUT, 'wasm_core_fetch_timeout'
      )
    }
    if (!cachedWasmURL) {
      cachedWasmURL = await withTimeout(
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        LOAD_TIMEOUT, 'wasm_binary_fetch_timeout'
      )
    }

    await withTimeout(
      ffmpeg.load({ coreURL: cachedCoreURL, wasmURL: cachedWasmURL }),
      LOAD_TIMEOUT, 'wasm_init_timeout'
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

/**
 * Sets the current progress callback for FFmpeg operations.
 */
export function setProgressHandler(handler) {
  currentProgressHandler = handler
}

/**
 * Build FFmpeg arguments based on target format and quality (1-10).
 */
function buildFFmpegArgs(inputName, outputName, format, quality) {
  const args = ['-y', '-i', inputName]

  switch (format) {
    case 'mp3': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      const bitrate = bitrates[quality - 1] || 192
      args.push('-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`)
      break
    }
    case 'aac':
    case 'm4a': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      const bitrate = bitrates[quality - 1] || 192
      args.push('-codec:a', 'aac', '-b:a', `${bitrate}k`)
      break
    }
    case 'ogg': {
      args.push('-codec:a', 'libvorbis', '-q:a', `${quality}`)
      break
    }
    case 'flac': {
      const level = Math.min(8, Math.max(0, quality - 2))
      args.push('-codec:a', 'flac', '-compression_level', `${level}`)
      break
    }
    case 'wav': {
      if (quality <= 4) {
        args.push('-codec:a', 'pcm_s16le')
      } else if (quality <= 7) {
        args.push('-codec:a', 'pcm_s24le')
      } else {
        args.push('-codec:a', 'pcm_f32le')
      }
      break
    }
    case 'opus': {
      const bitrates = [32, 48, 64, 96, 128, 160, 192, 256, 320, 510]
      const bitrate = bitrates[quality - 1] || 128
      args.push('-codec:a', 'libopus', '-b:a', `${bitrate}k`)
      break
    }
    case 'aiff': {
      if (quality <= 4) {
        args.push('-codec:a', 'pcm_s16be')
      } else if (quality <= 7) {
        args.push('-codec:a', 'pcm_s24be')
      } else {
        args.push('-codec:a', 'pcm_s32be')
      }
      break
    }
    case 'wma': {
      const bitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
      const bitrate = bitrates[quality - 1] || 192
      args.push('-codec:a', 'wmav2', '-b:a', `${bitrate}k`)
      break
    }
    default:
      break
  }

  args.push(outputName)
  return args
}

/**
 * Converts an audio file locally using FFmpeg.wasm.
 * Returns a Blob with the converted audio data.
 * All operations are guarded by timeouts — a hang will throw, not freeze.
 */
export async function convertLocally(file, targetFormat, quality, onProgress) {
  const instance = await loadFFmpeg()
  if (!instance) throw new Error('wasm_not_loaded')

  setProgressHandler(onProgress || null)

  const inputExt = file.name.split('.').pop() || 'mp3'
  const inputName = `input.${inputExt}`
  const outputName = `output.${targetFormat}`

  try {
    await instance.writeFile(inputName, await fetchFile(file))

    const args = buildFFmpegArgs(inputName, outputName, targetFormat, quality)
    await withTimeout(instance.exec(args), EXEC_TIMEOUT, 'wasm_exec_timeout')

    const data = await instance.readFile(outputName)
    if (!data || data.length === 0) throw new Error('wasm_empty_output')

    const mimeTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      opus: 'audio/opus',
      aiff: 'audio/aiff',
      wma: 'audio/x-ms-wma'
    }

    return new Blob([data.buffer], { type: mimeTypes[targetFormat] || 'audio/mpeg' })
  } finally {
    setProgressHandler(null)
    try { await instance.deleteFile(inputName) } catch (_) {}
    try { await instance.deleteFile(outputName) } catch (_) {}
  }
}
