// ── Share-to-app helper ───────────────────────────────────────────────────────
// Hands files to the operating system's share sheet (Web Share API Level 2) so
// the user can send them to WhatsApp, mail, AirDrop etc. Browsers without file
// sharing (Firefox desktop, older browsers) report 'unsupported' and the caller
// falls back to a download.

import { mimeTypeFor } from '@/utils/fileSaver'

export interface ShareEntry {
  name: string
  blob: Blob
}

/**
 * - `shared`: the share sheet completed.
 * - `cancelled`: the user closed the share sheet.
 * - `unsupported`: the browser cannot share these files (API missing or type rejected).
 * - `needsGesture`: the click's user activation expired while files were loading;
 *   sharing works when called again from a fresh click.
 */
export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'needsGesture'

/** True when the browser offers file sharing at all (decides whether to show the button). */
export function isFileShareSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  )
}

/** Wraps blobs as File objects with the audio MIME type the share targets expect. */
export function toShareFiles(entries: ShareEntry[]): File[] {
  return entries.map(
    (entry) =>
      new File([entry.blob], entry.name, { type: mimeTypeFor(entry.name, entry.blob.type) })
  )
}

/**
 * Opens the system share sheet for the given files. Must be called from a user
 * gesture (click); throws only for unexpected errors.
 */
export async function shareFiles(files: File[], title?: string): Promise<ShareResult> {
  if (files.length === 0 || !isFileShareSupported()) return 'unsupported'

  const data: ShareData = { files }
  if (title) data.title = title
  if (!navigator.canShare(data)) return 'unsupported'

  try {
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'AbortError') return 'cancelled'
      if (error.name === 'NotAllowedError') return 'needsGesture'
      // Chrome rejects some files only at share time (e.g. a file type it does not allow).
      if (error.name === 'TypeError' || error.name === 'DataError') return 'unsupported'
    }
    if (error instanceof TypeError) return 'unsupported'
    throw error
  }
}
