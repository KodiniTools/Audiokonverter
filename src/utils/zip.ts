import JSZip from 'jszip'

export interface ZipEntry {
  name: string
  data: Blob
}

/**
 * Macht doppelte Dateinamen eindeutig („song.mp3“, „song (2).mp3“, …).
 * JSZip überschreibt sonst stillschweigend einen gleichnamigen Eintrag, etwa
 * wenn „song.wav“ und „song.flac“ beide zu „song.mp3“ konvertiert wurden.
 */
export function uniqueZipNames(names: readonly string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => {
    let candidate = name
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${base} (${n})${ext}`
    used.add(candidate.toLowerCase())
    return candidate
  })
}

/**
 * Baut das ZIP stückweise. `generateAsync({ type: 'blob' })` legt das ganze
 * Archiv in einem einzigen zusammenhängenden ArrayBuffer an; bei großen
 * Dateien scheitert das mit „RangeError: Array buffer allocation failed“.
 * Hier entsteht der Blob aus vielen kleinen Teilen, die der Browser bei Bedarf
 * auf die Platte auslagern kann. Audio ist bereits komprimiert, daher STORE.
 */
export function buildZipBlob(entries: readonly ZipEntry[]): Promise<Blob> {
  const zip = new JSZip()
  const names = uniqueZipNames(entries.map((entry) => entry.name))
  entries.forEach((entry, i) => zip.file(names[i], entry.data))

  return new Promise<Blob>((resolve, reject) => {
    // JSZip liefert Uint8Arrays über normalen ArrayBuffern (nie SharedArrayBuffer)
    const parts: BlobPart[] = []
    zip
      .generateInternalStream({ type: 'uint8array', streamFiles: true, compression: 'STORE' })
      .on('data', (chunk) => parts.push(chunk as Uint8Array<ArrayBuffer>))
      .on('error', reject)
      .on('end', () => resolve(new Blob(parts, { type: 'application/zip' })))
      .resume()
  })
}
