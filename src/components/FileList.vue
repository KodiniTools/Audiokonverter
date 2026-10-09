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
        :class="[file.status, { playing: player.isCurrent(file.id) }]"
      >
        <div class="file-item-content">
          <div
            class="file-item-info"
            role="button"
            tabindex="0"
            :title="t('player.playHint')"
            @click="player.playFile(file)"
            @keydown.enter.prevent="player.playFile(file)"
            @keydown.space.prevent="player.playFile(file)"
          >
            <span
              class="btn-play-indicator"
              :class="{ active: player.isCurrent(file.id) }"
              aria-hidden="true"
            >
              <svg v-if="!isRowPlaying(file.id)" viewBox="0 0 24 24" width="14" height="14">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
              </svg>
            </span>
            <div class="file-details">
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <div class="file-size-info">
                <span class="file-size" :class="{ original: file.status === 'completed' }">
                  {{ formatFileSize(file.size) }}
                </span>
                <template v-if="file.status === 'completed' && file.convertedSize">
                  <span class="size-arrow" aria-hidden="true">→</span>
                  <span class="file-size converted">
                    {{ file.convertedFormat }} {{ formatFileSize(file.convertedSize) }}
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="file-item-status">
            <!-- Processing mode badge -->
            <span
              v-if="file.status === 'pending'"
              class="mode-badge"
              :class="file.processedLocally ? 'local' : 'server'"
            >
              {{ file.processedLocally ? t('status.local') : t('status.server') }}
            </span>

            <!-- Status Badge -->
            <span v-if="file.status !== 'pending'" class="status-badge" :class="file.status">
              <span class="status-dot" aria-hidden="true"></span>
              {{ t(`status.${file.status}`) }}
            </span>

            <!-- Circular Progress -->
            <div v-if="file.status === 'converting'" class="progress-circle">
              <svg viewBox="0 0 36 36" class="progress-ring">
                <path
                  class="progress-ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="progress-ring-fill"
                  :stroke-dasharray="`${file.progress}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span class="progress-text">{{ file.progress }}%</span>
            </div>

            <!-- Download Button -->
            <button
              v-if="file.status === 'completed'"
              class="btn-icon btn-download"
              :title="t('actions.download')"
              aria-label="Download"
              @click="downloadFile(file)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>

            <!-- Retry Button -->
            <button
              v-if="file.status === 'error'"
              class="btn-icon btn-retry"
              :title="t('actions.retry')"
              aria-label="Retry"
              @click="audioStore.convertFile(file)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <!-- Remove Button -->
            <button
              class="btn-icon btn-remove"
              :title="t('fileList.remove')"
              aria-label="Remove"
              @click="removeFile(file.id)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
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

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import { useDownload } from '@/composables/useDownload'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { formatFileSize } from '@/utils/fileUtils'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()
const { downloadFile } = useDownload()
const player = useAudioPlayer()

const formattedTotalSize = computed(() => formatFileSize(audioStore.totalSize))

function isRowPlaying(fileId: string): boolean {
  return player.isCurrent(fileId) && player.isPlaying.value
}

function removeFile(fileId: string): void {
  player.releaseFile(fileId)
  audioStore.removeFile(fileId)
  showToast('info', t('toast.fileRemoved'))
}
</script>

<style scoped>
/* Panel (UiPanel): Fläche 1, Hairline, großer Radius */
.file-list-section {
  padding: var(--ds-space-4) var(--ds-space-5) var(--ds-space-5);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-3);
}

.file-list-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.file-list-size {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
}

.file-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  max-height: 320px;
  overflow-y: auto;
  padding-right: var(--ds-space-1);
  scrollbar-width: thin;
  scrollbar-color: var(--ds-border-strong) transparent;
}

/* Zeile: Eingabefläche mit Hairline; laufende Datei im Auswahl-Muster */
.file-item {
  padding: var(--ds-space-2) var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);
}

.file-item:hover {
  border-color: var(--ds-border-strong);
}

.file-item.playing {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
}

.file-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-3);
  min-height: var(--ds-control-md);
}

/* Klickbarer Bereich: spielt die Datei im Sticky-Player */
.file-item-info {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex: 1;
  min-width: 0;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
}

.file-item-info:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.btn-play-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  flex-shrink: 0;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
  color: var(--ds-text-2);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);
}

.file-item-info:hover .btn-play-indicator {
  background: var(--ds-surface-3);
  color: var(--ds-text);
}

.btn-play-indicator.active {
  background: var(--ds-accent);
  border-color: var(--ds-accent);
  color: var(--ds-on-accent);
}

.file-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.file-name {
  overflow: hidden;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
}

.size-arrow {
  color: var(--ds-text-3);
}

.file-size.converted {
  color: var(--ds-text);
  font-weight: var(--ds-weight-medium);
}

.file-item-status {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  flex-shrink: 0;
}

/* Badges: neutrale Pille, Status nur über den Punkt (Status spricht über Icon und Linie) */
.status-badge,
.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  height: 22px;
  padding: 0 var(--ds-space-2);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.completed .status-dot {
  background: var(--ds-success);
}

.status-badge.error .status-dot {
  background: var(--ds-danger);
}

.status-badge.converting .status-dot {
  background: var(--ds-accent);
}

/* Fortschrittsring: Spur in Rahmenfarbe, Füllung in Akzent */
.progress-circle {
  position: relative;
  width: var(--ds-control-lg);
  height: var(--ds-control-lg);
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: var(--ds-border-strong);
  stroke-width: 3;
}

.progress-ring-fill {
  fill: none;
  stroke: var(--ds-accent);
  stroke-width: 3;
  stroke-linecap: round;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: var(--ds-tracking-tight);
  color: var(--ds-text);
  font-variant-numeric: tabular-nums;
}

/* Löschen ist destruktiv: Icon in --ds-danger bei Hover, flache Fläche */
.btn-remove:hover:not(:disabled) {
  color: var(--ds-danger);
}

.file-error {
  margin-top: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-danger);
}

@media (max-width: 768px) {
  .file-list {
    max-height: 260px;
  }
}

@media (max-width: 480px) {
  .file-list-section {
    padding: var(--ds-space-4);
  }

  .file-item-content {
    flex-wrap: wrap;
  }

  .file-item-status {
    width: 100%;
    justify-content: flex-end;
  }

  .btn-icon {
    width: var(--ds-control-md);
    height: var(--ds-control-md);
  }
}
</style>
