/**
 * Selbst gehosteter FFmpeg-Kern (@ffmpeg/core, ESM-Build).
 *
 * Die Dateien werden beim Build aus node_modules nach dist/<FFMPEG_CORE_DIR>/
 * kopiert (Plugin in vite.config.ts) und im Dev-Server unter demselben Pfad
 * ausgeliefert. Die Version muss zur installierten @ffmpeg/core passen und zu
 * CORE_VERSION von @ffmpeg/ffmpeg (geprüft in tests/ffmpegCore.spec.ts).
 */
export const FFMPEG_CORE_VERSION = '0.12.6'

/**
 * Pfad relativ zur App-Basis. Die Version steht im Pfad, damit der
 * CacheFirst-Cache des Service Workers nach einem Update nicht den alten Kern
 * ausliefert.
 */
export const FFMPEG_CORE_DIR = `ffmpeg/${FFMPEG_CORE_VERSION}`

export const FFMPEG_CORE_FILES = ['ffmpeg-core.js', 'ffmpeg-core.wasm'] as const
