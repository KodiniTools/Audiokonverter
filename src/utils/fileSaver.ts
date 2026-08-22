// ── Save-to-device helper ─────────────────────────────────────────────────────
// Opens a native "Save As" dialog (File System Access API) so the user can pick
// the filename and storage location. Falls back to a classic anchor download on
// browsers that don't support the API (Firefox, Safari, most mobile browsers).

export type SaveResult = 'saved' | 'cancelled' | 'fallback'

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
  aiff: 'audio/aiff',
  wma: 'audio/x-ms-wma',
  zip: 'application/zip',
}

function getExtension(fileName: string): string {
  const match = /\.([^.\\/]+)$/.exec(fileName)
  return match ? match[1].toLowerCase() : ''
}

type SaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>

function getFilePicker(): SaveFilePicker | null {
  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    return window.showSaveFilePicker.bind(window)
  }
  return null
}

function anchorDownload(blob: Blob, suggestedName: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Save a blob to the device. When supported, shows a dialog letting the user
 * choose the filename and location; otherwise triggers a normal download.
 *
 * @returns `'saved'` when written via the picker, `'cancelled'` when the user
 *   dismissed the dialog, or `'fallback'` when a classic download was used.
 */
export async function saveBlobToDevice(blob: Blob, suggestedName: string): Promise<SaveResult> {
  const showSaveFilePicker = getFilePicker()
  if (showSaveFilePicker) {
    const extension = getExtension(suggestedName)
    const mimeType = MIME_BY_EXTENSION[extension] || blob.type || 'application/octet-stream'

    const options: SaveFilePickerOptions = { suggestedName }
    if (extension) {
      options.types = [
        {
          description: `${extension.toUpperCase()} file`,
          accept: { [mimeType]: [`.${extension}`] },
        },
      ]
    }

    try {
      const handle = await showSaveFilePicker(options)
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (error) {
      // User dismissed the dialog — nothing was saved.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      // Any other failure (e.g. permission/security) — fall back to a download
      // so the user still gets their file.
      anchorDownload(blob, suggestedName)
      return 'fallback'
    }
  }

  anchorDownload(blob, suggestedName)
  return 'fallback'
}
