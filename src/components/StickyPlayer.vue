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
/* Player-Leiste: Overlay am unteren Rand – Fläche 1, Hairline oben, Overlay-Schatten */
.sticky-player {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--ds-z-player);
  background: var(--ds-surface-1);
  border-top: var(--ds-border-width) solid var(--ds-border);
  box-shadow: var(--ds-shadow-overlay);
}

.sticky-player-inner {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  max-width: var(--ds-container);
  min-height: var(--ds-player-height);
  margin: 0 auto;
  padding: var(--ds-space-2) var(--ds-gutter);
}

/* Titel */
.sp-track {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex: 1 1 180px;
  min-width: 0;
}

.sp-track-icon {
  flex-shrink: 0;
  color: var(--ds-text-2);
}

.sp-track-name {
  overflow: hidden;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Steuerung */
.sp-controls {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex: 2 1 320px;
  min-width: 0;
}

/* Play/Pause: Primäraktion der Leiste, rund */
.sp-play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-lg);
  height: var(--ds-control-lg);
  flex-shrink: 0;
  background: var(--ds-accent);
  border: 0;
  border-radius: var(--ds-radius-full);
  color: var(--ds-on-accent);
  cursor: pointer;
  transition: background-color var(--ds-duration) var(--ds-ease);
}

.sp-play-btn:hover:not(:disabled) {
  background: var(--ds-accent-hover);
}

.sp-play-btn:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.sp-play-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sp-progress {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex: 1;
  min-width: 0;
}

.sp-time {
  flex-shrink: 0;
  min-width: 40px;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.sp-seek {
  flex: 1;
  min-width: 0;
}

/* Lautstärke */
.sp-volume {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex: 0 1 130px;
}

.sp-volume-icon {
  flex-shrink: 0;
  color: var(--ds-text-2);
}

.sp-volume-slider {
  max-width: 100px;
}

@media (max-width: 768px) {
  .sticky-player-inner {
    flex-wrap: wrap;
    gap: var(--ds-space-2) var(--ds-space-3);
    padding: var(--ds-space-2) var(--ds-space-4);
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
