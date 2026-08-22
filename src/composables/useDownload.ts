import type { AudioFile } from '@/types'
import { saveBlobToDevice, type SaveResult } from '@/utils/fileSaver'

export function useDownload() {
  async function downloadFile(fileData: AudioFile): Promise<SaveResult> {
    if (!fileData.convertedUrl) return 'cancelled'

    const response = await fetch(fileData.convertedUrl)
    const blob = await response.blob()
    const suggestedName = fileData.convertedName ?? `converted-${fileData.name}`
    return saveBlobToDevice(blob, suggestedName)
  }

  async function downloadAllFiles(files: AudioFile[]): Promise<void> {
    const completed = files.filter((f) => f.status === 'completed' && f.convertedUrl)
    for (const fileData of completed) {
      const result = await downloadFile(fileData)
      // Stop the batch if the user dismissed the save dialog.
      if (result === 'cancelled') break
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
    }
  }

  return { downloadFile, downloadAllFiles }
}
