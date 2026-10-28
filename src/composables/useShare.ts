import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AudioFile } from '@/types'
import { useToast } from '@/composables/useToast'
import { saveBlobToDevice } from '@/utils/fileSaver'
import { isFileShareSupported, shareFiles, toShareFiles, type ShareEntry } from '@/utils/fileSharer'
import { buildZipBlob, uniqueZipNames } from '@/utils/zip'

/**
 * ID der Datei, die gerade geteilt wird; `'all'` für „Alle teilen“. Gemeinsam für
 * alle Instanzen, damit Liste und „Alle teilen“ nicht gleichzeitig ein Menü öffnen.
 */
const sharingId = ref<string | null>(null)

/**
 * Teilt konvertierte Dateien über das System-Teilen-Menü. Kann der Browser die
 * Dateien nicht teilen, werden sie heruntergeladen (eine Datei direkt, mehrere als ZIP).
 */
export function useShare() {
  const { t } = useI18n()
  const { showToast, removeToast } = useToast()
  const canShare = isFileShareSupported()

  async function loadEntries(files: AudioFile[]): Promise<ShareEntry[]> {
    const entries: ShareEntry[] = []
    for (const fileData of files) {
      if (!fileData.convertedUrl) continue
      const response = await fetch(fileData.convertedUrl)
      // Sonst würde z. B. die 404-Antwort einer abgelaufenen Serverdatei geteilt
      if (!response.ok) throw new Error(`${fileData.name}: HTTP ${response.status}`)
      entries.push({
        name: fileData.convertedName || `converted-${fileData.name}`,
        blob: await response.blob(),
      })
    }
    const names = uniqueZipNames(entries.map((entry) => entry.name))
    return entries.map((entry, i) => ({ ...entry, name: names[i] }))
  }

  async function downloadInstead(entries: ShareEntry[]): Promise<void> {
    showToast('info', t('share.unsupported'), { message: t('share.downloadInstead') })
    if (entries.length === 1) {
      await saveBlobToDevice(entries[0].blob, entries[0].name)
      return
    }
    const zip = await buildZipBlob(entries.map((entry) => ({ name: entry.name, data: entry.blob })))
    await saveBlobToDevice(zip, 'converted-audio-files.zip')
  }

  async function openShareSheet(entries: ShareEntry[], allowRetry: boolean): Promise<void> {
    const result = await shareFiles(toShareFiles(entries), t('app.title'))
    switch (result) {
      case 'shared':
        showToast('success', t('share.done', { count: entries.length }, entries.length))
        return
      case 'cancelled':
        return
      case 'unsupported':
        await downloadInstead(entries)
        return
      case 'needsGesture': {
        // Das Laden hat den Klick „verbraucht“; ein neuer Klick öffnet das Menü sofort.
        if (!allowRetry) {
          await downloadInstead(entries)
          return
        }
        const toastId = showToast('info', t('share.ready'), {
          duration: 0,
          actions: [
            {
              label: t('share.shareNow'),
              callback: () => {
                removeToast(toastId)
                void openShareSheet(entries, false).catch(handleError)
              },
            },
          ],
        })
        return
      }
      default: {
        const exhaustive: never = result
        throw new Error(`Unbekanntes Teilen-Ergebnis: ${String(exhaustive)}`)
      }
    }
  }

  function handleError(error: unknown): void {
    console.error('Share failed:', error)
    showToast('error', t('share.failed'), { message: (error as Error).message })
  }

  /** Teilt alle fertig konvertierten Dateien aus `files`. */
  async function shareConverted(files: AudioFile[], key: string): Promise<void> {
    if (sharingId.value !== null) return
    const completed = files.filter((f) => f.status === 'completed' && f.convertedUrl)
    if (completed.length === 0) {
      showToast('warning', t('toast.noFilesToDownload'))
      return
    }

    sharingId.value = key
    try {
      const entries = await loadEntries(completed)
      await openShareSheet(entries, true)
    } catch (error) {
      handleError(error)
    } finally {
      sharingId.value = null
    }
  }

  function shareFile(fileData: AudioFile): Promise<void> {
    return shareConverted([fileData], fileData.id)
  }

  function shareAll(files: AudioFile[]): Promise<void> {
    return shareConverted(files, 'all')
  }

  return { canShare, sharingId, shareFile, shareAll }
}
