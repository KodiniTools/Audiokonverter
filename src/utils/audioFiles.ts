/** Höchstgröße einer einzelnen Audiodatei (Upload und aus ZIP entpackt). */
export const MAX_FILE_SIZE = 300 * 1024 * 1024

const SUPPORTED_MIME_SUBTYPES = [
  'mpeg',
  'wav',
  'flac',
  'ogg',
  'aac',
  'x-m4a',
  'mp4',
  'opus',
  'aiff',
  'x-aiff',
  'x-ms-wma',
  'webm',
]

const AUDIO_EXTENSION = /\.(mp3|wav|flac|ogg|aac|m4a|opus|aiff|aif|wma|webm|weba)$/i

/** MIME-Typ je Endung, für Dateien ohne Typ (z. B. aus einem ZIP entpackt). */
const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  wma: 'audio/x-ms-wma',
  webm: 'audio/webm',
  weba: 'audio/webm',
}

/** Unterstützte Audiodatei, erkannt am MIME-Typ oder an der Endung. */
export function isAudioFile(file: Pick<File, 'name' | 'type'>): boolean {
  return (
    SUPPORTED_MIME_SUBTYPES.some((subtype) => file.type.includes(subtype)) ||
    AUDIO_EXTENSION.test(file.name)
  )
}

/** Dateiname mit unterstützter Audio-Endung. */
export function hasAudioExtension(name: string): boolean {
  return AUDIO_EXTENSION.test(name)
}

/** MIME-Typ aus der Endung; leer, wenn die Endung unbekannt ist. */
export function audioMimeFromName(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  return MIME_BY_EXTENSION[ext] ?? ''
}

/** ZIP-Archiv, erkannt am MIME-Typ oder an der Endung. */
export function isZipFile(file: Pick<File, 'name' | 'type'>): boolean {
  return (
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    /\.zip$/i.test(file.name)
  )
}
