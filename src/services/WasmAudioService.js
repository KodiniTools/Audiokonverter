import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const WASM_THRESHOLD = 20 * 1024 * 1024 // 20MB

let ffmpeg = null
let loaded = false
let loading = false

/**
 * Determines whether a file should be processed locally via WebAssembly.
 * Files under 20MB are processed in the browser; larger files go to the server.
 */
export function shouldProcessLocally(file) {
  return file.size <= WASM_THRESHOLD
}

/**
 * Initializes FFmpeg.wasm (v0.12+ API). Loads core + wasm from CDN as blob URLs
 * to avoid CORS/SharedArrayBuffer issues.
 */
export async function loadFFmpeg(onProgress) {
  if (loaded) return ffmpeg
  if (loading) {
    // Wait for existing load to finish
    while (loading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return ffmpeg
  }

  loading = true
  try {
    ffmpeg = new FFmpeg()

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100))
      })
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    })

    loaded = true
    return ffmpeg
  } finally {
    loading = false
  }
}

/**
 * Build FFmpeg arguments based on target format and quality (1-10).
 */
function buildFFmpegArgs(inputName, outputName, format, quality) {
  const args = ['-i', inputName]

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
 */
export async function convertLocally(file, targetFormat, quality, onProgress) {
  const instance = await loadFFmpeg(onProgress)

  const inputExt = file.name.split('.').pop() || 'mp3'
  const inputName = `input.${inputExt}`
  const outputName = `output.${targetFormat}`

  // Write input file to virtual filesystem
  await instance.writeFile(inputName, await fetchFile(file))

  // Run conversion
  const args = buildFFmpegArgs(inputName, outputName, targetFormat, quality)
  await instance.exec(args)

  // Read output
  const data = await instance.readFile(outputName)

  // Cleanup virtual filesystem
  await instance.deleteFile(inputName)
  await instance.deleteFile(outputName)

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
}
