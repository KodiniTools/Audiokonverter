<template>
  <div v-if="audioStore.hasFiles" class="sticky-player">
    <div class="sticky-player-inner">
      <!-- Titel-Info -->
      <div class="sp-track">
        <svg class="sp-track-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" fill="currentColor" />
        </svg>
        <span class="sp-track-name" :title="currentName || undefined">
          {{ currentName || t('player.noTrack') }}
        </span>
      </div>

      <!-- Steuerung + Fortschritt -->
      <div class="sp-controls">
        <button
          class="sp-play-btn"
          :disabled="!hasTrack"
          :title="isPlaying ? t('actions.pause') : t('actions.play')"
          :aria-label="isPlaying ? t('actions.pause') : t('actions.play')"
          @click="player.toggle()"
        >
          <svg v-if="!isPlaying" viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
          </svg>
        </button>

        <div class="sp-progress">
          <span class="sp-time">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            class="sp-seek"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="currentTime"
            :disabled="!hasTrack || !duration"
            :aria-label="t('player.seek')"
            @input="onSeek"
          />
          <span class="sp-time">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Lautstaerke -->
      <div class="sp-volume">
        <svg class="sp-volume-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
            fill="currentColor"
          />
        </svg>
        <input
          type="range"
          class="sp-volume-slider"
          min="0"
          max="1"
          step="0.05"
          :value="volume"
          :title="t('actions.volume')"
          :aria-label="t('actions.volume')"
          @input="onVolume"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useAudioPlayer } from '@/composables/useAudioPlayer'

const { t } = useI18n()
const audioStore = useAudioStore()
const player = useAudioPlayer()
const { currentName, isPlaying, currentTime, duration, volume, hasTrack } = player

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function onSeek(event: Event): void {
  player.seek(parseFloat((event.target as HTMLInputElement).value))
}

function onVolume(event: Event): void {
  player.setVolume(parseFloat((event.target as HTMLInputElement).value))
}

// Seiten-Inhalt nach unten schieben, damit die fixe Leiste nichts verdeckt.
watch(
  () => audioStore.hasFiles,
  (visible) => {
    document.body.classList.toggle('has-sticky-player', visible)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.body.classList.remove('has-sticky-player')
})
</script>

<style scoped>
.sticky-player {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: var(--glass-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid var(--glass-border, rgba(1, 79, 153, 0.15));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
  animation: spSlideUp 0.3s ease;
}

.sticky-player-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Titel */
.sp-track {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1 1 180px;
}

.sp-track-icon {
  color: var(--primary-color);
  flex-shrink: 0;
}

.sp-track-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Steuerung */
.sp-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 2 1 320px;
  min-width: 0;
}

.sp-play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--primary-color);
  color: #f5f4d6;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(1, 79, 153, 0.3);
}

.sp-play-btn:hover:not(:disabled) {
  transform: scale(1.06);
}

.sp-play-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.sp-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.sp-time {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: center;
}

.sp-seek {
  flex: 1;
  min-width: 0;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(1, 79, 153, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.sp-seek:disabled {
  cursor: default;
  opacity: 0.6;
}

/* Lautstaerke */
.sp-volume {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 0 1 130px;
}

.sp-volume-icon {
  color: var(--text-secondary);
  opacity: 0.7;
  flex-shrink: 0;
}

.sp-volume-slider {
  width: 100%;
  max-width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(1, 79, 153, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

/* Slider-Thumbs (Seek + Volume) */
.sp-seek::-webkit-slider-thumb,
.sp-volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
}

.sp-seek::-moz-range-thumb,
.sp-volume-slider::-moz-range-thumb {
  width: 13px;
  height: 13px;
  background: var(--primary-color);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

@keyframes spSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .sticky-player-inner {
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    padding: 0.5rem 0.75rem;
  }

  .sp-track {
    flex: 1 1 60%;
    order: 1;
  }

  .sp-volume {
    flex: 0 0 auto;
    order: 2;
    margin-left: auto;
  }

  .sp-controls {
    flex: 1 1 100%;
    order: 3;
  }
}

@media (max-width: 480px) {
  .sp-volume {
    display: none;
  }
}
</style>

<style>
/* Global: verhindert, dass die fixe Player-Leiste Seiteninhalt verdeckt */
body.has-sticky-player {
  padding-bottom: 76px;
}

@media (max-width: 768px) {
  body.has-sticky-player {
    padding-bottom: 108px;
  }
}
</style>
