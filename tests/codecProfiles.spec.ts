/**
 * Codec-Profile: Oberfläche (src/config/codecProfiles.ts) und Backend
 * (backend/codecArgs.js, CommonJS) lesen backend/codecProfiles.json. Der Test
 * vergleicht die ffmpeg-Argumente beider Seiten für jedes Format und jede
 * Qualitätsstufe, so wie die Oberfläche sie schickt (nur `quality`).
 */
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import {
  CODEC_PROFILES,
  QUALITY_LEVELS,
  bitrateKbps,
  codecArgs,
  describeQuality,
  pcmLevel,
} from '@/config/codecProfiles'
import type { AudioFormat } from '@/types'

interface BackendCodecArgs {
  FORMATS: readonly string[]
  PROFILES: Record<string, unknown>
  isAllowedFormat: (fmt: string) => boolean
  qualityToBitrate: (quality: number, format: string) => string | null
  audioCodecArgs: (fmt: string, bitrate: string | null, quality: number | null) => string[]
}

const require = createRequire(import.meta.url)
const backend = require('../backend/codecArgs.js') as BackendCodecArgs

const ALL_FORMATS: AudioFormat[] = [
  'mp3',
  'wav',
  'flac',
  'ogg',
  'aac',
  'm4a',
  'opus',
  'aiff',
  'wma',
]
const QUALITIES = Array.from({ length: QUALITY_LEVELS }, (_, i) => i + 1)

/** Argumente, die nur der Server setzt (M4A: Videospur verwerfen, moov nach vorn). */
const SERVER_ONLY_ARGS: Partial<Record<AudioFormat, string[]>> = {
  m4a: ['-vn', '-movflags', '+faststart'],
}

function serverCodecArgs(format: AudioFormat, quality: number): string[] {
  const args = backend.audioCodecArgs(format, backend.qualityToBitrate(quality, format), quality)
  const extra = SERVER_ONLY_ARGS[format] ?? []
  return args.filter((arg) => !extra.includes(arg))
}

describe('Codec-Profile: eine Tabelle für Oberfläche und Backend', () => {
  it('beide Seiten laden dieselbe Tabelle', () => {
    expect(backend.PROFILES).toEqual(CODEC_PROFILES)
  })

  it('enthält genau die unterstützten Formate', () => {
    expect([...backend.FORMATS].sort()).toEqual([...ALL_FORMATS].sort())
    expect(Object.keys(CODEC_PROFILES).sort()).toEqual([...ALL_FORMATS].sort())
    for (const format of ALL_FORMATS) expect(backend.isAllowedFormat(format)).toBe(true)
    expect(backend.isAllowedFormat('exe')).toBe(false)
  })

  it.each(ALL_FORMATS)('%s: jede Stufe 1–10 ist vollständig belegt', (format) => {
    const profile = CODEC_PROFILES[format]
    for (const list of [profile.bitratesKbps, profile.vbrQuality, profile.compressionLevels]) {
      if (list) expect(list).toHaveLength(QUALITY_LEVELS)
    }
    if (profile.pcmLevels) {
      expect(profile.pcmLevels[profile.pcmLevels.length - 1].upToQuality).toBe(QUALITY_LEVELS)
    }
  })

  it.each(ALL_FORMATS)('%s: lokal und Server erzeugen dieselben Codec-Argumente', (format) => {
    for (const quality of QUALITIES) {
      expect(serverCodecArgs(format, quality), `Qualität ${quality}`).toEqual(
        codecArgs(format, quality)
      )
    }
  })

  it('der Server übernimmt eine explizit gesendete Bitrate weiterhin', () => {
    expect(backend.audioCodecArgs('mp3', '128k', null)).toEqual([
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '128k',
    ])
  })
})

describe('Abfragen der Tabelle', () => {
  it('bitrateKbps liefert die Bitrate je Stufe und null ohne Bitraten-Tabelle', () => {
    expect(bitrateKbps('mp3', 7)).toBe(256)
    expect(bitrateKbps('opus', 10)).toBe(510)
    expect(bitrateKbps('opus', 11)).toBe(128)
    expect(bitrateKbps('flac', 5)).toBeNull()
  })

  it('pcmLevel liefert Codec und Bittiefe', () => {
    expect(pcmLevel('wav', 5)).toMatchObject({ codec: 'pcm_s24le', bitDepth: 24, float: false })
    expect(pcmLevel('wav', 10)).toMatchObject({ codec: 'pcm_f32le', bitDepth: 32, float: true })
    expect(pcmLevel('mp3', 5)).toBeNull()
  })

  it.each<[AudioFormat, number, string]>([
    ['mp3', 7, '256 kbps'],
    ['m4a', 3, '128 kbps'],
    ['opus', 1, '32 kbps'],
    ['wma', 10, '320 kbps'],
    ['ogg', 6, 'Q6'],
    ['flac', 1, 'Lossless (Level 0)'],
    ['flac', 10, 'Lossless (Level 8)'],
    ['wav', 4, '16-bit PCM'],
    ['wav', 8, '32-bit Float'],
    ['aiff', 9, '32-bit PCM'],
  ])('describeQuality(%s, %i) → %s', (format, quality, expected) => {
    expect(describeQuality(format, quality)).toBe(expected)
  })
})
