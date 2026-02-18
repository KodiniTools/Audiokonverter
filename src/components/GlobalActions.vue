<template>
  <div class="global-actions">
    <div class="actions-grid">
      <!-- Clear All -->
      <button
        class="action-btn btn-secondary"
        @click="clearAll"
        :title="t('actions.clearAll')"
      >
        <i class="fas fa-trash-alt"></i>
        <span>{{ t('actions.clearAll') }}</span>
      </button>

      <!-- Download All Separately -->
      <button
        v-if="audioStore.hasConvertedFiles"
        class="action-btn btn-primary"
        @click="downloadAllSeparately"
        :disabled="isDownloadingSeparate"
        :title="t('actions.downloadAll')"
      >
        <i :class="isDownloadingSeparate ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
        <span>{{ isDownloadingSeparate ? t('actions.downloading') : t('actions.downloadAll') }}</span>
      </button>

      <!-- Download All as ZIP -->
      <button
        v-if="audioStore.hasConvertedFiles"
        class="action-btn btn-success"
        @click="downloadAllAsZip"
        :disabled="isDownloading"
        :title="t('actions.downloadAllAsZip')"
      >
        <i :class="isDownloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-archive'"></i>
        <span>{{ isDownloading ? t('actions.creatingZip') : t('actions.downloadAllAsZip') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import JSZip from 'jszip'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast, showConfirmToast } = useToast()
const isDownloading = ref(false)
const isDownloadingSeparate = ref(false)

async function clearAll() {
  const confirmed = await showConfirmToast(
    'warning',
    t('actions.clearAll'),
    'Möchten Sie wirklich alle Dateien löschen?'
  )

  if (confirmed) {
    audioStore.clearAllFiles()
    showToast('info', t('toast.allFilesCleared'))
  }
}

async function downloadAllSeparately() {
  const completedFiles = audioStore.audioFiles.filter(f => f.status === 'completed' && f.convertedUrl)

  if (completedFiles.length === 0) {
    showToast('warning', t('toast.noFilesToDownload'))
    return
  }

  isDownloadingSeparate.value = true

  try {
    for (const fileData of completedFiles) {
      await audioStore.downloadFile(fileData)
      // Kurze Pause zwischen Downloads für bessere Browser-Kompatibilität
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    showToast('success', t('toast.allFilesDownloaded'))
  } catch (error) {
    console.error('Download failed:', error)
    showToast('error', t('toast.downloadFailed'))
  } finally {
    isDownloadingSeparate.value = false
  }
}

async function downloadAllAsZip() {
  const completedFiles = audioStore.audioFiles.filter(f => f.status === 'completed' && f.convertedUrl)

  if (completedFiles.length === 0) {
    showToast('warning', t('toast.noFilesToDownload'))
    return
  }

  isDownloading.value = true

  try {
    const zip = new JSZip()

    for (const fileData of completedFiles) {
      const response = await fetch(fileData.convertedUrl)
      const blob = await response.blob()
      zip.file(fileData.convertedName || `converted-${fileData.name}`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const url = window.URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'converted-audio-files.zip'
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showToast('success', t('toast.zipDownloadStarted'))
  } catch (error) {
    console.error('ZIP download failed:', error)
    showToast('error', t('toast.zipDownloadFailed'), { message: error.message })
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.global-actions {
  margin: 0.75rem 0 0;
  animation: fadeIn 0.35s ease;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.btn-secondary {
  background: rgba(1, 79, 153, 0.1);
  color: var(--text-color);
  border: 1px solid rgba(1, 79, 153, 0.15);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(1, 79, 153, 0.2);
}

.btn-primary {
  background: var(--accent-gradient);
  color: #F5F4D6;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover:not(:disabled) {
  filter: brightness(1.1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .action-btn {
    font-size: 0.8rem;
    padding: 0.55rem 0.9rem;
  }
}

@media (max-width: 480px) {
  .global-actions {
    margin: 0.5rem 0 0;
  }

  .action-btn {
    width: 100%;
    min-width: unset;
    font-size: 0.8rem;
    padding: 0.6rem 0.9rem;
    min-height: 44px;
  }
}
</style>
