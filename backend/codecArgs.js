/**
 * Codec-Argumente des Backends, gelesen aus codecProfiles.json.
 *
 * Dieselbe Tabelle lädt die Oberfläche (src/config/codecProfiles.ts) für die
 * lokale WASM-Konvertierung; tests/codecProfiles.spec.ts prüft, dass beide
 * Seiten für jedes Format und jede Qualitätsstufe dieselben Argumente bilden.
 */

const { formats: PROFILES } = require('./codecProfiles.json')

const FORMATS = Object.freeze(Object.keys(PROFILES))

function isAllowedFormat(fmt) {
  return FORMATS.includes(String(fmt || '').toLowerCase())
}

/** Ziel-Bitrate (z. B. '192k') für Formate mit Bitraten-Tabelle, sonst null. */
function qualityToBitrate(quality, format) {
  const profile = PROFILES[format]
  if (!profile || !profile.bitratesKbps) return null
  const q = Math.max(1, Math.min(10, Number(quality) || 5))
  return (profile.bitratesKbps[q - 1] || profile.defaultBitrateKbps) + 'k'
}

function pcmCodec(levels, quality) {
  if (!quality) return levels[0].codec
  const level = levels.find((l) => quality <= l.upToQuality) || levels[levels.length - 1]
  return level.codec
}

/** Codec-Argumente je Zielformat. */
function audioCodecArgs(fmt, bitrate, quality) {
  const profile = PROFILES[fmt]
  if (!profile) return []
  if (profile.pcmLevels) return ['-codec:a', pcmCodec(profile.pcmLevels, quality)]

  const codec = ['-codec:a', profile.codec]
  if (profile.bitratesKbps) {
    const rate = bitrate || profile.defaultBitrateKbps + 'k'
    // M4A ist ein MP4-Container: nur Audio übernehmen und den moov-Block nach
    // vorne legen, damit die Datei beim Download sofort abspielbar ist.
    if (fmt === 'm4a') return ['-vn', ...codec, '-b:a', rate, '-movflags', '+faststart']
    return [...codec, '-b:a', rate]
  }
  if (profile.vbrQuality) {
    return quality
      ? [...codec, '-q:a', String(profile.vbrQuality[quality - 1] ?? quality)]
      : [...codec, '-b:a', bitrate || profile.defaultBitrateKbps + 'k']
  }
  if (profile.compressionLevels) {
    const level = quality
      ? (profile.compressionLevels[quality - 1] ?? profile.defaultCompressionLevel)
      : profile.defaultCompressionLevel
    return [...codec, '-compression_level', String(level)]
  }
  return codec
}

module.exports = { FORMATS, PROFILES, isAllowedFormat, qualityToBitrate, audioCodecArgs }
