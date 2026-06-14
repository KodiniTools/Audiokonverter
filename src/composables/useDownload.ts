import type { AudioFile } from '@/types'

export function useDownload() {
  async function downloadFile(fileData: AudioFile): Promise<void> {
    if (!fileData.convertedUrl) return

    try {
      const response = await fetch(fileData.convertedUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileData.convertedName ?? `converted-${fileData.name}`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(fileData.convertedUrl!, '_blank')
    }
  }

  async function downloadAllFiles(files: AudioFile[]): Promise<void> {
    const completed = files.filter((f) => f.status === 'completed' && f.convertedUrl)
    for (const fileData of completed) {
      await downloadFile(fileData)
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
    }
  }

  return { downloadFile, downloadAllFiles }
}
