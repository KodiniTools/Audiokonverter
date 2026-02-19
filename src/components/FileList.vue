<template>
  <div class="file-list-section glass-card">
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
              {{ t(`status.${file.status}`) }}
            </span>

            <!-- Circular Progress -->
            <div v-if="file.status === 'converting'" class="progress-circle">
              <svg viewBox="0 0 36 36" class="progress-ring">
                <path class="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="progress-ring-fill" :stroke-dasharray="`${file.progress}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="progress-text">{{ file.progress }}%</span>
            </div>

            <!-- Download Button -->
            <button
              v-if="file.status === 'completed'"
              class="btn-icon btn-download"
              @click="audioStore.downloadFile(file)"
              :title="t('actions.download')"
              aria-label="Download"
            >&#8595;</button>

            <!-- Retry Button -->
            <button
              v-if="file.status === 'error'"
              class="btn-icon btn-retry"
              @click="audioStore.convertFile(file)"
              :title="t('actions.retry')"
              aria-label="Retry"
            >&#8635;</button>

            <!-- Remove Button -->
            <button
              class="btn-icon btn-remove"
              @click="removeFile(file.id)"
              :title="t('fileList.remove')"
              aria-label="Remove"
            >&times;</button>
          </div>
        </div>

        <!-- Audio Controls -->
        <div class="audio-controls">
          <button
            class="btn-icon btn-play"
            @click="togglePlay(file)"
            :title="isPlayingFile(file.id) ? t('actions.pause') : t('actions.play')"
          >
            <svg v-if="!isPlayingFile(file.id)" viewBox="0 0 24 24" width="14" height="14">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
            </svg>
          </button>
          <svg class="volume-icon" viewBox="0 0 24 24" width="12" height="12">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
          </svg>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="1"
            step="0.05"
            :value="volume"
            @input="updateVolume($event.target.value)"
            :title="t('actions.volume')"
          />
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
import { computed, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()

const formattedTotalSize = computed(() => {
  return audioStore.formatFileSize(audioStore.totalSize)
})

// Audio Player
const currentPlayingId = ref(null)
const isPlaying = ref(false)
const volume = ref(0.7)
const audioEl = new Audio()
const objectUrls = new Map()

audioEl.volume = volume.value

function getAudioSrc(file) {
  if (file.status === 'completed' && file.convertedUrl) {
    return file.convertedUrl
  }
  if (!objectUrls.has(file.id)) {
    objectUrls.set(file.id, URL.createObjectURL(file.file))
  }
  return objectUrls.get(file.id)
}

function isPlayingFile(fileId) {
  return currentPlayingId.value === fileId && isPlaying.value
}

function togglePlay(file) {
  if (currentPlayingId.value === file.id && isPlaying.value) {
    audioEl.pause()
    isPlaying.value = false
    return
  }

  const src = getAudioSrc(file)
  if (currentPlayingId.value !== file.id) {
    audioEl.src = src
    currentPlayingId.value = file.id
  }
  audioEl.play().catch(() => {
    isPlaying.value = false
  })
  isPlaying.value = true
}

function updateVolume(val) {
  volume.value = parseFloat(val)
  audioEl.volume = volume.value
}

audioEl.addEventListener('ended', () => {
  isPlaying.value = false
})

function removeFile(fileId) {
  if (currentPlayingId.value === fileId) {
    audioEl.pause()
    audioEl.src = ''
    currentPlayingId.value = null
    isPlaying.value = false
  }
  if (objectUrls.has(fileId)) {
    URL.revokeObjectURL(objectUrls.get(fileId))
    objectUrls.delete(fileId)
  }
  audioStore.removeFile(fileId)
  showToast('info', t('toast.fileRemoved'))
}

onUnmounted(() => {
  audioEl.pause()
  audioEl.src = ''
  objectUrls.forEach(url => URL.revokeObjectURL(url))
  objectUrls.clear()
})
</script>

<style scoped>
.file-list-section {
  padding: 1.25rem;
  animation: slideInUp 0.35s ease;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
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

.progress-circle {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(1, 79, 153, 0.15);
  stroke-width: 3;
}

.progress-ring-fill {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--primary-color);
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

.btn-download:hover {
  color: var(--success-color);
}

.btn-retry:hover {
  color: var(--primary-color);
}

.btn-remove:hover {
  color: var(--error-color);
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(1, 79, 153, 0.08);
}

.btn-play {
  color: var(--primary-color);
  padding: 0.2rem;
  flex-shrink: 0;
}

.btn-play:hover {
  color: var(--primary-color);
  background: rgba(1, 79, 153, 0.12);
}

.volume-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
  opacity: 0.6;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(1, 79, 153, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 50%;
  border: none;
  cursor: pointer;
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

@media (max-width: 480px) {
  .file-list-section {
    padding: 1rem;
  }

  .file-list {
    max-height: 220px;
    gap: 0.4rem;
  }

  .file-item {
    padding: 0.6rem;
    border-radius: 6px;
  }

  .file-item-info {
    gap: 0.5rem;
  }

  .file-name {
    font-size: 0.8rem;
  }

  .file-size {
    font-size: 0.7rem;
  }

  .status-badge {
    padding: 0.2rem 0.4rem;
    font-size: 0.65rem;
  }

  .btn-icon {
    padding: 0.4rem;
    min-width: 32px;
    min-height: 32px;
  }

  .file-error {
    font-size: 0.7rem;
    padding: 0.4rem;
  }

  .volume-slider {
    width: 60px;
  }
}
</style>
