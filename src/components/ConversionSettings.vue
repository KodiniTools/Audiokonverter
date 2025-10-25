<template>
  <div v-if="audioStore.hasFiles" class="conversion-settings">
    <h3 class="settings-title">
      <i class="fas fa-cog"></i>
      {{ t('conversion.title') }}
    </h3>

    <div class="settings-grid">
      <!-- Format Selection -->
      <div class="setting-group">
        <label for="format-select" class="setting-label">
          <i class="fas fa-file-audio"></i>
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
          <option value="ogg">OGG Vorbis</option>
          <option value="aac">AAC</option>
          <option value="m4a">M4A</option>
        </select>
      </div>

      <!-- Quality Slider -->
      <div class="setting-group">
        <label for="quality-slider" class="setting-label">
          <i class="fas fa-sliders-h"></i>
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
            <span class="marker">{{ t('conversion.qualityLevels.low') }}</span>
            <span class="marker">{{ t('conversion.qualityLevels.medium') }}</span>
            <span class="marker">{{ t('conversion.qualityLevels.high') }}</span>
            <span class="marker">{{ t('conversion.qualityLevels.maximum') }}</span>
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
      <i :class="audioStore.isConverting ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
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
    return `Lossless (Compression Level ${Math.min(8, quality - 2)})`
  }

  if (format === 'wav') {
    if (quality <= 4) return '16-bit PCM (CD Quality)'
    if (quality <= 7) return '24-bit PCM (Studio Quality)'
    return '32-bit Float (Maximum Quality)'
  }

  if (format === 'ogg') {
    return `Quality Level ${quality}`
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
  border: 1px solid rgba(184, 184, 184, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  animation: fadeInUp 0.5s ease;
}

.settings-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-label {
  font-weight: 500;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.setting-select {
  padding: 0.75rem 1rem;
  border: 2px solid rgba(184, 184, 184, 0.2);
  border-radius: 8px;
  background: var(--background);
  color: var(--text-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-select:hover,
.setting-select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.quality-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quality-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(184, 184, 184, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quality-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(144, 144, 144, 0.1);
}

.quality-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.quality-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(144, 144, 144, 0.1);
}

.quality-markers {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.marker {
  text-align: center;
}

.quality-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
}

.btn-convert {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-convert:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeInUp {
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
  .conversion-settings {
    padding: 1.5rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
