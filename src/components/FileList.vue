<template>
  <div v-if="audioStore.hasFiles" class="file-list-section">
    <div class="file-list-header">
      <h3 class="file-list-title">
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
            <i class="fas fa-music file-icon"></i>
            <div class="file-details">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <div class="file-size-info">
                <span class="file-size" :class="{ 'original': file.status === 'completed' }">
                  {{ audioStore.formatFileSize(file.size) }}
                </span>
                <template v-if="file.status === 'completed' && file.convertedSize">
                  <span class="size-arrow">→</span>
                  <span class="file-size converted">
                    {{ file.convertedFormat }} {{ audioStore.formatFileSize(file.convertedSize) }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="file-item-status">
            <!-- Status Badge -->
            <span v-if="file.status !== 'pending'" class="status-badge" :class="file.status">
              <i :class="getStatusIcon(file.status)"></i>
              {{ t(`status.${file.status}`) }}
            </span>

            <!-- Progress Bar -->
            <div v-if="file.status === 'converting'" class="progress-bar-small">
              <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
            </div>

            <!-- Download Button -->
            <button
              v-if="file.status === 'completed'"
              class="btn-icon btn-download"
              @click="audioStore.downloadFile(file)"
              :title="t('actions.download')"
            >
              <i class="fas fa-download"></i>
            </button>

            <!-- Retry Button -->
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
    completed: 'fas fa-check',
    error: 'fas fa-exclamation',
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
  margin: 1rem 0;
  animation: slideInUp 0.35s ease;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
}

.file-list-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.file-list-size {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.file-list::-webkit-scrollbar {
  width: 4px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb {
  background: rgba(1, 79, 153, 0.35);
  border-radius: 2px;
}

.file-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(1, 79, 153, 0.35) transparent;
}

.file-item {
  background: var(--card-background);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.file-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-item.completed {
  border-left: 3px solid var(--success-color);
}

.file-item.error {
  border-left: 3px solid var(--error-color);
}

.file-item.converting {
  border-left: 3px solid var(--primary-color);
}

.file-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.file-item-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.1rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.file-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.file-size.original {
  color: var(--text-secondary);
  opacity: 0.7;
}

.size-arrow {
  font-size: 0.7rem;
  color: var(--success-color);
  font-weight: bold;
}

.file-size.converted {
  color: var(--success-color);
  font-weight: 500;
}

.file-item-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.status-badge.converting {
  background: rgba(1, 79, 153, 0.15);
  color: var(--primary-color);
}

.progress-bar-small {
  width: 50px;
  height: 4px;
  background: rgba(1, 79, 153, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.btn-icon:hover {
  background: rgba(1, 79, 153, 0.12);
}

.btn-icon i {
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
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 4px;
  color: var(--error-color);
  font-size: 0.75rem;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .file-list {
    max-height: 250px;
  }

  .file-item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .file-item-status {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
