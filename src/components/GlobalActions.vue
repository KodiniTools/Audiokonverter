<template>
  <div v-if="audioStore.hasFiles" class="global-actions">
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
  margin: 2rem 0;
  animation: fadeIn 0.5s ease;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(144, 144, 144, 0.1);
  color: var(--text-color);
  border: 2px solid rgba(144, 144, 144, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(144, 144, 144, 0.2);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr 1fr;
  }

  .action-btn span {
    font-size: 0.875rem;
  }
}
</style>
