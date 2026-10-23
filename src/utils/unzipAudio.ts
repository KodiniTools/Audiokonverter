import JSZip from 'jszip'
import { MAX_FILE_SIZE, audioMimeFromName, hasAudioExtension, isZipFile } from '@/utils/audioFiles'

/**
 * Grenzen gegen ZIP-Bomben und Speicherüberlauf. JSZip liest das Archiv
 * vollständig in den Speicher, daher ist das Archiv selbst begrenzt; die
 * entpackten Daten werden beim Lesen mitgezählt, nicht den (fälschbaren)
 * Größenangaben im Archiv geglaubt.
 */
export interface ZipLimits {
  /** Größe des Archivs selbst. */
  maxArchiveSize: number
  /** Einträge im Inhaltsverzeichnis (Dateien und Ordner). */
  maxEntries: number
  /** Entpackte Größe je Datei. */
  maxFileSize: number
  /** Entpackte Größe aller Dateien eines Archivs zusammen. */
  maxTotalSize: number
}

export const DEFAULT_ZIP_LIMITS: ZipLimits = {
  maxArchiveSize: 500 * 1024 * 1024,
  maxEntries: 1000,
  maxFileSize: MAX_FILE_SIZE,
  maxTotalSize: 2 * 1024 * 1024 * 1024,
}

export type ZipErrorCode = 'archive_too_large' | 'too_many_entries' | 'invalid_zip'

/** Das Archiv als Ganzes ist unbrauchbar; einzelne Einträge scheitern nie mit diesem Fehler. */
export class ZipExtractError extends Error {
  constructor(readonly code: ZipErrorCode) {
    super(code)
    this.name = 'ZipExtractError'
  }
}

export interface ZipExtractResult {
  /** Entpackte Audiodateien in Archiv-Reihenfolge. */
  files: File[]
  /** Übersprungene Einträge: kein Audio, versteckt (z. B. __MACOSX, ._*), verschachtelte ZIPs. */
  skipped: string[]
  /** Audiodateien über maxFileSize. */
  tooLarge: string[]
  /** Beschädigte oder nicht lesbare Audio-Einträge. */
  failed: string[]
  /** maxTotalSize erreicht; alle folgenden Audio-Einträge fehlen. */
  limitReached: boolean
}

/** Versteckte Pfade: macOS-Metadaten (__MACOSX, ._datei, .DS_Store) und Punkt-Ordner. */
function isHiddenPath(path: string): boolean {
  return path
    .split('/')
    .some((segment) => segment === '__MACOSX' || (segment.startsWith('.') && segment.length > 1))
}

function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

class EntryTooLarge extends Error {}

/** `internalStream` gehört zur JSZip-API (async() baut darauf auf), fehlt aber in den mitgelieferten Typen. */
type StreamableEntry = JSZip.JSZipObject & {
  internalStream(type: 'uint8array'): JSZip.JSZipStreamHelper<Uint8Array>
}

/** Liest einen Eintrag stückweise und bricht ab, sobald er `maxBytes` überschreitet. */
function readEntry(entry: JSZip.JSZipObject, maxBytes: number): Promise<Uint8Array<ArrayBuffer>[]> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array<ArrayBuffer>[] = []
    let size = 0
    const stream = (entry as StreamableEntry).internalStream('uint8array')
    stream
      .on('data', (chunk) => {
        size += chunk.length
        if (size > maxBytes) {
          stream.pause()
          chunks.length = 0
          reject(new EntryTooLarge())
          return
        }
        // JSZip liefert Uint8Arrays über normalen ArrayBuffern (nie SharedArrayBuffer)
        chunks.push(chunk as Uint8Array<ArrayBuffer>)
      })
      .on('error', reject)
      .on('end', () => resolve(chunks))
      .resume()
  })
}

/**
 * Entpackt alle unterstützten Audiodateien eines ZIP-Archivs im Browser.
 * Einträge werden nacheinander gelesen, damit höchstens eine Datei zusätzlich
 * zum Archiv im Speicher entsteht. Ordnerstrukturen werden flach gemacht
 * (nur der Dateiname zählt); verschachtelte ZIPs werden nicht entpackt.
 * @throws ZipExtractError wenn das Archiv zu groß, zu umfangreich oder kein gültiges ZIP ist.
 */
export async function extractAudioFromZip(
  archive: Blob,
  limits: ZipLimits = DEFAULT_ZIP_LIMITS
): Promise<ZipExtractResult> {
  if (archive.size > limits.maxArchiveSize) throw new ZipExtractError('archive_too_large')

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(archive)
  } catch {
    throw new ZipExtractError('invalid_zip')
  }

  const entries = Object.values(zip.files)
  if (entries.length > limits.maxEntries) throw new ZipExtractError('too_many_entries')

  const result: ZipExtractResult = {
    files: [],
    skipped: [],
    tooLarge: [],
    failed: [],
    limitReached: false,
  }
  let total = 0

  for (const entry of entries) {
    if (entry.dir) continue
    const name = baseName(entry.name)
    if (
      !name ||
      isHiddenPath(entry.name) ||
      isZipFile({ name, type: '' }) ||
      !hasAudioExtension(name)
    ) {
      result.skipped.push(entry.name)
      continue
    }
    if (result.limitReached) continue

    const budget = Math.min(limits.maxFileSize, limits.maxTotalSize - total)
    try {
      const chunks = await readEntry(entry, budget)
      const file = new File(chunks, name, {
        type: audioMimeFromName(name),
        lastModified: entry.date.getTime(),
      })
      total += file.size
      result.files.push(file)
    } catch (error) {
      if (!(error instanceof EntryTooLarge)) {
        console.warn(`ZIP-Eintrag ${entry.name} konnte nicht entpackt werden:`, error)
        result.failed.push(entry.name)
      } else if (budget < limits.maxFileSize) {
        result.limitReached = true
      } else {
        result.tooLarge.push(name)
      }
    }
  }

  return result
}
