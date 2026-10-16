/**
 * Codec-Profile je Zielformat und Qualitätsstufe.
 *
 * Die Tabelle liegt als JSON in backend/codecProfiles.json, weil das Backend
 * CommonJS ist und deploy.sh nur backend/ auf den Server kopiert. Oberfläche
 * (Anzeige, WASM-Konvertierung) und Backend (backend/codecArgs.js) lesen
 * dieselbe Datei; tests/codecProfiles.spec.ts vergleicht die erzeugten
 * ffmpeg-Argumente beider Seiten.
 */
import table from '../../backend/codecProfiles.json'
import type { AudioFormat } from '@/types'

export interface PcmLevel {
  /** Gilt für alle Qualitätsstufen bis einschließlich dieser. */
  upToQuality: number
  codec: string
  bitDepth: number
  float: boolean
}

export interface CodecProfile {
  /** ffmpeg-Encoder; fehlt bei PCM-Formaten, dort steht er je Stufe in pcmLevels. */
  codec?: string
  /** Bitrate in kbps je Qualitätsstufe (Index = Qualität − 1). */
  bitratesKbps?: number[]
  defaultBitrateKbps?: number
  /** Vorbis-VBR-Qualität (-q:a) je Qualitätsstufe. */
  vbrQuality?: number[]
  /** FLAC-Kompressionsstufe je Qualitätsstufe. */
  compressionLevels?: number[]
  defaultCompressionLevel?: number
  pcmLevels?: PcmLevel[]
}

export const QUALITY_LEVELS: number = table.qualityLevels

export const CODEC_PROFILES: Readonly<Record<AudioFormat, CodecProfile>> = table.formats

/** Bitrate in kbps; außerhalb 1–10 die Standard-Bitrate, ohne Bitraten-Tabelle null. */
export function bitrateKbps(format: AudioFormat, quality: number): number | null {
  const profile = CODEC_PROFILES[format]
  if (!profile.bitratesKbps) return null
  return profile.bitratesKbps[quality - 1] ?? profile.defaultBitrateKbps ?? null
}

/** PCM-Stufe (Codec, Bittiefe) für WAV/AIFF, sonst null. */
export function pcmLevel(format: AudioFormat, quality: number): PcmLevel | null {
  const levels = CODEC_PROFILES[format].pcmLevels
  if (!levels?.length) return null
  return levels.find((level) => quality <= level.upToQuality) ?? levels[levels.length - 1]
}

function compressionLevel(profile: CodecProfile, quality: number): number | null {
  if (!profile.compressionLevels) return null
  return profile.compressionLevels[quality - 1] ?? profile.defaultCompressionLevel ?? null
}

function vbrQuality(profile: CodecProfile, quality: number): number | null {
  if (!profile.vbrQuality) return null
  return profile.vbrQuality[quality - 1] ?? quality
}

/** ffmpeg-Codec-Argumente der lokalen Konvertierung (ohne Ein- und Ausgabe). */
export function codecArgs(format: AudioFormat, quality: number): string[] {
  const profile = CODEC_PROFILES[format]
  const pcm = pcmLevel(format, quality)
  if (pcm) return ['-codec:a', pcm.codec]
  if (!profile.codec) return []

  const args = ['-codec:a', profile.codec]
  const kbps = bitrateKbps(format, quality)
  if (kbps !== null) return [...args, '-b:a', `${kbps}k`]
  const vbr = vbrQuality(profile, quality)
  if (vbr !== null) return [...args, '-q:a', `${vbr}`]
  const level = compressionLevel(profile, quality)
  if (level !== null) return [...args, '-compression_level', `${level}`]
  return args
}

/** Kurzbeschreibung der Qualitätsstufe für die Oberfläche, z. B. „256 kbps“ oder „24-bit PCM“. */
export function describeQuality(format: AudioFormat, quality: number): string {
  const profile = CODEC_PROFILES[format]
  const pcm = pcmLevel(format, quality)
  if (pcm) return `${pcm.bitDepth}-bit ${pcm.float ? 'Float' : 'PCM'}`

  const kbps = bitrateKbps(format, quality)
  if (kbps !== null) return `${kbps} kbps`
  const vbr = vbrQuality(profile, quality)
  if (vbr !== null) return `Q${vbr}`
  const level = compressionLevel(profile, quality)
  if (level !== null) return `Lossless (Level ${level})`
  return ''
}
