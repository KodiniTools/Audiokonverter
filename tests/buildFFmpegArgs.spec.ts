/**
 * FFmpeg-Argumente der lokalen (WASM-)Konvertierung je Zielformat.
 * Die Werte müssen zu backend/server.js (audioCodecArgs/qualityToBitrate) passen,
 * damit lokal und auf dem Server gleich konvertiert wird.
 */
import { describe, expect, it } from 'vitest'
import { buildFFmpegArgs, isWebmName } from '@/services/WasmAudioService'
import type { AudioFormat } from '@/types'

/** Nur die Codec-Argumente zwischen Eingabe und Ausgabedatei. */
function codecArgs(format: AudioFormat, quality: number, input = 'input.mp3'): string[] {
  const args = buildFFmpegArgs(input, `output.${format}`, format, quality)
  return args.slice(3, -1)
}

describe('buildFFmpegArgs', () => {
  it('beginnt mit -y -i <eingabe> und endet mit der Ausgabedatei', () => {
    const args = buildFFmpegArgs('input.wav', 'output.mp3', 'mp3', 7)
    expect(args.slice(0, 3)).toEqual(['-y', '-i', 'input.wav'])
    expect(args[args.length - 1]).toBe('output.mp3')
  })

  it.each<[AudioFormat, number, string[]]>([
    ['mp3', 1, ['-codec:a', 'libmp3lame', '-b:a', '64k']],
    ['mp3', 7, ['-codec:a', 'libmp3lame', '-b:a', '256k']],
    ['mp3', 10, ['-codec:a', 'libmp3lame', '-b:a', '320k']],
    ['aac', 5, ['-codec:a', 'aac', '-b:a', '192k']],
    ['m4a', 3, ['-codec:a', 'aac', '-b:a', '128k']],
    ['wma', 8, ['-codec:a', 'wmav2', '-b:a', '320k']],
    ['opus', 1, ['-codec:a', 'libopus', '-b:a', '32k']],
    ['opus', 10, ['-codec:a', 'libopus', '-b:a', '510k']],
    ['ogg', 6, ['-codec:a', 'libvorbis', '-q:a', '6']],
  ])('%s mit Qualität %i', (format, quality, expected) => {
    expect(codecArgs(format, quality)).toEqual(expected)
  })

  it.each<[number, string]>([
    [1, '0'],
    [2, '0'],
    [7, '5'],
    [10, '8'],
  ])('flac: Qualität %i ergibt Kompressionsstufe %s (begrenzt auf 0–8)', (quality, level) => {
    expect(codecArgs('flac', quality)).toEqual(['-codec:a', 'flac', '-compression_level', level])
  })

  it.each<[number, string]>([
    [4, 'pcm_s16le'],
    [5, 'pcm_s24le'],
    [7, 'pcm_s24le'],
    [8, 'pcm_f32le'],
  ])('wav: Qualität %i ergibt %s', (quality, codec) => {
    expect(codecArgs('wav', quality)).toEqual(['-codec:a', codec])
  })

  it.each<[number, string]>([
    [4, 'pcm_s16be'],
    [5, 'pcm_s24be'],
    [8, 'pcm_s32be'],
  ])('aiff: Qualität %i ergibt %s', (quality, codec) => {
    expect(codecArgs('aiff', quality)).toEqual(['-codec:a', codec])
  })

  it('fällt bei Qualität außerhalb 1–10 auf die Standard-Bitrate zurück', () => {
    expect(codecArgs('mp3', 0)).toEqual(['-codec:a', 'libmp3lame', '-b:a', '192k'])
    expect(codecArgs('opus', 11)).toEqual(['-codec:a', 'libopus', '-b:a', '128k'])
  })

  it('verwirft bei WebM-Eingaben die Videospur (-vn)', () => {
    const args = buildFFmpegArgs('input.webm', 'output.ogg', 'ogg', 5)
    expect(args.slice(0, 4)).toEqual(['-y', '-i', 'input.webm', '-vn'])
  })

  it('setzt -vn nicht bei reinen Audio-Eingaben', () => {
    expect(buildFFmpegArgs('input.flac', 'output.mp3', 'mp3', 5)).not.toContain('-vn')
  })
})

describe('isWebmName', () => {
  it.each([
    ['clip.webm', true],
    ['voice.WEBA', true],
    ['song.mp3', false],
    ['webm.mp3', false],
  ])('%s → %s', (name, expected) => {
    expect(isWebmName(name)).toBe(expected)
  })
})
