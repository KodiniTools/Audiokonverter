<template>
  <div class="global-actions">
    <div class="actions-grid">
      <!-- Clear All -->
      <!-- Destruktiv: textbasiert in --ds-danger -->
      <button class="btn btn-danger action-btn" :title="t('actions.clearAll')" @click="clearAll">
        <span>{{ t('actions.clearAll') }}</span>
      </button>

      <!-- Share All: System-Teilen-Menü, nur wenn der Browser Dateien teilen kann -->
      <button
        v-if="audioStore.hasConvertedFiles && share.canShare"
        class="btn btn-secondary action-btn"
        :disabled="share.sharingId.value !== null"
        :title="t('share.all')"
        @click="share.shareAll(audioStore.audioFiles)"
      >
        <span>{{ share.sharingId.value === 'all' ? t('share.sharing') : t('share.all') }}</span>
      </button>

      <!-- Download All Separately -->
      <button
        v-if="audioStore.hasConvertedFiles"
        class="btn btn-secondary action-btn"
        :disabled="isDownloadingSeparate"
        :title="t('actions.downloadAll')"
        @click="downloadAllSeparately"
      >
        <span>{{
          isDownloadingSeparate ? t('actions.downloading') : t('actions.downloadAll')
        }}</span>
      </button>

      <!-- Download All as ZIP -->
      <button
        v-if="audioStore.hasConvertedFiles"
        class="btn btn-secondary action-btn"
        :disabled="isDownloading"
        :title="t('actions.downloadAllAsZip')"
        @click="downloadAllAsZip"
      >
        <span>{{ isDownloading ? t('actions.creatingZip') : t('actions.downloadAllAsZip') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import { useDownload } from '@/composables/useDownload'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useShare } from '@/composables/useShare'
import { saveBlobToDevice } from '@/utils/fileSaver'
import { buildZipBlob, type ZipEntry } from '@/utils/zip'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast, showConfirmToast } = useToast()
const { downloadFile } = useDownload()
const player = useAudioPlayer()
const share = useShare()
const isDownloading = ref(false)
const isDownloadingSeparate = ref(false)

async function clearAll(): Promise<void> {
  const confirmed = await showConfirmToast(
    'warning',
    t('actions.clearAll'),
    t('actions.confirmDeleteAll')
  )

  if (confirmed) {
    player.stopAll()
    audioStore.clearAllFiles()
    showToast('info', t('toast.allFilesCleared'))
  }
}

async function downloadAllSeparately(): Promise<void> {
  const completedFiles = audioStore.audioFiles.filter(
    (f) => f.status === 'completed' && f.convertedUrl
  )

  if (completedFiles.length === 0) {
    showToast('warning', t('toast.noFilesToDownload'))
    return
  }

  isDownloadingSeparate.value = true

  try {
    let savedCount = 0
    for (const fileData of completedFiles) {
      const result = await downloadFile(fileData)
      // User dismissed the save dialog — stop the batch.
      if (result === 'cancelled') break
      savedCount++
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (savedCount > 0) {
      showToast('success', t('toast.allFilesDownloaded'))
    }
  } catch (error) {
    console.error('Download failed:', error)
    showToast('error', t('toast.downloadFailed'))
  } finally {
    isDownloadingSeparate.value = false
  }
}

async function downloadAllAsZip(): Promise<void> {
  const completedFiles = audioStore.audioFiles.filter(
    (f) => f.status === 'completed' && f.convertedUrl
  )

  if (completedFiles.length === 0) {
    showToast('warning', t('toast.noFilesToDownload'))
    return
  }

  isDownloading.value = true

  try {
    const entries: ZipEntry[] = []
    for (const fileData of completedFiles) {
      const response = await fetch(fileData.convertedUrl!)
      // Sonst landet z. B. die 404-Antwort einer abgelaufenen Serverdatei im ZIP
      if (!response.ok) throw new Error(`${fileData.name}: HTTP ${response.status}`)
      entries.push({
        name: fileData.convertedName || `converted-${fileData.name}`,
        data: await response.blob(),
      })
    }

    const zipBlob = await buildZipBlob(entries)

    const result = await saveBlobToDevice(zipBlob, 'converted-audio-files.zip')

    if (result !== 'cancelled') {
      showToast('success', t('toast.zipDownloadStarted'))
    }
  } catch (error) {
    console.error('ZIP download failed:', error)
    showToast('error', t('toast.zipDownloadFailed'), { message: (error as Error).message })
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.global-actions {
  margin: var(--ds-space-3) 0 0;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.action-btn {
  width: 100%;
}
</style>
