<template>
  <div v-if="audioStore.hasFiles" class="file-list-section">
    <div class="file-list-header">
      <h3 class="file-list-title">
        <i class="fas fa-file-audio"></i>
        {{ t('upload.filesSelected', { count: audioStore.fileCount }) }}
      </h3>
      <span class="file-list-size">{{ formattedTotalSize }}</span>
    </div>

    <ul class="file-list">
      <li
        v-for="file in audioStore.audioFiles"
        :key="file.id"
        class="file-item"
        :class="file.status"
      >
        <div class="file-item-content">
          <div class="file-item-info">
            <i class="fas fa-file-audio file-icon"></i>
            <div class="file-details">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <span class="file-size">{{ audioStore.formatFileSize(file.size) }}</span>
            </div>
          </div>

          <div class="file-item-status">
            <!-- Status Badge -->
            <span v-if="file.status !== 'pending'" class="status-badge" :class="file.status">
              <i :class="getStatusIcon(file.status)"></i>
              {{ t(`status.${file.status}`) }}
            </span>

            <!-- Progress Bar (nur während Konvertierung) -->
            <div v-if="file.status === 'converting'" class="progress-bar-small">
              <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
            </div>

            <!-- Download Button (wenn fertig) -->
            <button
              v-if="file.status === 'completed'"
              class="btn-icon btn-download"
              @click="audioStore.downloadFile(file)"
              :title="t('actions.download')"
            >
              <i class="fas fa-download"></i>
            </button>

            <!-- Retry Button (bei Fehler) -->
            <button
              v-if="file.status === 'error'"
              class="btn-icon btn-retry"
              @click="audioStore.convertFile(file)"
              :title="t('actions.retry')"
            >
              <i class="fas fa-redo"></i>
            </button>

            <!-- Remove Button -->
            <button
              class="btn-icon btn-remove"
              @click="removeFile(file.id)"
              :title="t('fileList.remove')"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="file.error" class="file-error">
          <i class="fas fa-exclamation-circle"></i>
          {{ file.error }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()

const formattedTotalSize = computed(() => {
  return audioStore.formatFileSize(audioStore.totalSize)
})

function getStatusIcon(status) {
  const icons = {
    converting: 'fas fa-spinner fa-spin',
    completed: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    pending: 'fas fa-clock'
  }
  return icons[status] || 'fas fa-circle'
}

function removeFile(fileId) {
  audioStore.removeFile(fileId)
  showToast('info', t('toast.fileRemoved'))
}
</script>

<style scoped>
.file-list-section {
  margin: 2rem 0;
  animation: slideInUp 0.5s ease;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.file-list-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-list-size {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  background: var(--card-background);
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-item.completed {
  border-left: 4px solid var(--success-color);
}

.file-item.error {
  border-left: 4px solid var(--error-color);
}

.file-item.converting {
  border-left: 4px solid var(--primary-color);
}

.file-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.file-item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.file-item-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.status-badge.error {
  background: rgba(244, 67, 54, 0.1);
  color: var(--error-color);
}

.status-badge.converting {
  background: rgba(144, 144, 144, 0.1);
  color: var(--primary-color);
}

.progress-bar-small {
  width: 80px;
  height: 6px;
  background: rgba(184, 184, 184, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(144, 144, 144, 0.1);
}
.btn-icon i {                    /* ← NEU! Diese 3 Zeilen einfügen! */
  pointer-events: none;
}
.btn-download:hover {
  color: var(--success-color);
}

.btn-retry:hover {
  color: var(--primary-color);
}

.btn-remove:hover {
  color: var(--error-color);
}

.file-error {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
  color: var(--error-color);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .file-item-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .file-item-status {
    width: 100%;
    justify-content: space-between;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
