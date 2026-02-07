<template>
  <div v-if="audioStore.hasFiles" class="conversion-settings">
    <h3 class="settings-title">{{ t('conversion.title') }}</h3>

    <div class="settings-grid">
      <!-- Format Selection -->
      <div class="setting-group">
        <label for="format-select" class="setting-label">
          {{ t('conversion.format') }}
        </label>
        <select
          id="format-select"
          v-model="audioStore.currentFormat"
          class="setting-select"
        >
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="flac">FLAC</option>
          <option value="ogg">OGG</option>
          <option value="aac">AAC</option>
          <option value="m4a">M4A</option>
        </select>
      </div>

      <!-- Quality Slider -->
      <div class="setting-group">
        <label for="quality-slider" class="setting-label">
          {{ t('conversion.quality') }}: <strong>{{ qualityLabel }}</strong>
        </label>
        <div class="quality-control">
          <input
            id="quality-slider"
            type="range"
            min="1"
            max="10"
            v-model.number="audioStore.currentQuality"
            class="quality-slider"
          >
          <div class="quality-markers">
            <span>{{ t('conversion.qualityLevels.low') }}</span>
            <span>{{ t('conversion.qualityLevels.maximum') }}</span>
          </div>
        </div>
        <p class="quality-info">{{ qualityInfo }}</p>
      </div>
    </div>

    <!-- Convert Button -->
    <button
      class="btn btn-primary btn-convert"
      :disabled="audioStore.isConverting || !hasPendingFiles"
      @click="startConversion"
    >
      <i :class="audioStore.isConverting ? 'fas fa-spinner fa-spin' : 'fas fa-bolt'"></i>
      {{ audioStore.isConverting ? t('conversion.converting') : t('conversion.convert') }}
    </button>
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

const hasPendingFiles = computed(() => {
  return audioStore.audioFiles.some(f => f.status === 'pending' || f.status === 'error')
})

const qualityLabel = computed(() => {
  const quality = audioStore.currentQuality
  if (quality <= 3) return t('conversion.qualityLevels.low')
  if (quality <= 6) return t('conversion.qualityLevels.medium')
  if (quality <= 8) return t('conversion.qualityLevels.high')
  return t('conversion.qualityLevels.maximum')
})

const qualityInfo = computed(() => {
  const quality = audioStore.currentQuality
  const format = audioStore.currentFormat

  const bitrates = {
    mp3: [64, 96, 128, 160, 192, 224, 256, 320, 320, 320],
    aac: [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
  }

  if (format === 'mp3' || format === 'aac' || format === 'm4a') {
    const bitrate = bitrates[format === 'm4a' ? 'aac' : format][quality - 1]
    return `${bitrate} kbps`
  }

  if (format === 'flac') {
    return `Lossless (Level ${Math.min(8, quality - 2)})`
  }

  if (format === 'wav') {
    if (quality <= 4) return '16-bit PCM'
    if (quality <= 7) return '24-bit PCM'
    return '32-bit Float'
  }

  if (format === 'ogg') {
    return `Q${quality}`
  }

  return ''
})

async function startConversion() {
  try {
    await audioStore.convertAllFiles()
    showToast('success', t('toast.conversionComplete'))
  } catch (error) {
    showToast('error', t('toast.conversionFailed'), {
      message: error.message
    })
  }
}
</script>

<style scoped>
.conversion-settings {
  background: var(--card-background);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 12px;
  padding: 1.25rem;
  margin: 1rem 0;
  animation: slideInUp 0.35s ease;
}

.settings-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.85rem;
}

.setting-select {
  padding: 0.6rem 0.9rem;
  border: 1px solid rgba(1, 79, 153, 0.25);
  border-radius: 6px;
  background: var(--background);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-select:hover,
.setting-select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.quality-control {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.quality-slider {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: rgba(1, 79, 153, 0.25);
  outline: none;
  -webkit-appearance: none;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(1, 79, 153, 0.4);
}

.quality-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.quality-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.quality-markers {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.quality-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.btn-convert {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  gap: 0.5rem;
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
  .conversion-settings {
    padding: 1rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
