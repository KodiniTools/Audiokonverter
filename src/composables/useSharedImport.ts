import type { SharedFile } from '@/types'

/** Abhängigkeiten der Übernahme (für Tests injizierbar). */
export interface SharedImportDeps {
  /** Aktueller Query-String, z. B. "?source=audio-cutter". */
  search: string
  getSharedFiles: () => Promise<SharedFile[]>
  clearSharedFiles: () => Promise<void>
  addFiles: (files: File[]) => unknown
}

/**
 * Übernimmt Dateien, die ein anderes KodiniTools-Tool (z. B. der Audio-Schneider)
 * über die gemeinsame IndexedDB übergeben hat. Aktiv nur mit `?source=<tool>`;
 * übernommen werden nur Einträge genau dieser Quelle, danach wird der Speicher geleert.
 * Eigene Übergaben des Konverters (source=audiokonverter) werden nie re-importiert.
 * @returns Anzahl übernommener Dateien.
 */
export async function importSharedFiles(deps: SharedImportDeps): Promise<number> {
  const source = new URLSearchParams(deps.search).get('source')
  if (!source || source === 'audiokonverter') return 0

  const entries = (await deps.getSharedFiles()).filter(
    (e) => e.source === source && e.blob instanceof Blob
  )
  if (entries.length === 0) return 0

  const files = entries.map(
    (e) => new File([e.blob], e.name, { type: e.mimeType || e.blob.type, lastModified: e.sharedAt })
  )
  deps.addFiles(files)
  await deps.clearSharedFiles()
  return files.length
}
