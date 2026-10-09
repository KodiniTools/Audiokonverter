<template>
  <div class="conversion-settings glass-card">
    <h3 class="settings-title">{{ t('conversion.title') }}</h3>

    <div class="settings-grid">
      <!-- Format Selection -->
      <div class="setting-group">
        <label for="format-select" class="setting-label">
          {{ t('conversion.format') }}
        </label>
        <select id="format-select" v-model="audioStore.currentFormat" class="setting-select">
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="flac">FLAC</option>
          <option value="ogg">OGG</option>
          <option value="aac">AAC</option>
          <option value="m4a">M4A</option>
          <option value="opus">OPUS</option>
          <option value="aiff">AIFF</option>
          <option value="wma">WMA</option>
        </select>
        <p class="format-hint">{{ formatHint }}</p>
      </div>

      <!-- Quality Slider -->
      <div class="setting-group">
        <label for="quality-slider" class="setting-label">
          {{ t('conversion.quality') }}: <strong>{{ qualityLabel }}</strong>
        </label>
        <div class="quality-control">
          <input
            id="quality-slider"
            v-model.number="audioStore.currentQuality"
            type="range"
            min="1"
            max="10"
            class="quality-slider"
          />
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
      class="btn btn-primary btn-lg btn-block btn-convert"
      :disabled="audioStore.isConverting || !hasPendingFiles"
      @click="startConversion"
    >
      <svg
        v-if="audioStore.isConverting"
        class="ds-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {{ audioStore.isConverting ? t('conversion.converting') : t('conversion.convert') }}
    </button>

    <!-- Cancel Button: nur während einer laufenden Konvertierung sichtbar -->
    <button
      v-if="audioStore.isConverting"
      class="btn btn-danger btn-block btn-cancel"
      :disabled="audioStore.isCancelling"
      @click="cancelConversion"
    >
      {{ audioStore.isCancelling ? t('conversion.cancelling') : t('conversion.cancel') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()

const formatHint = computed(() => {
  return t(`conversion.formatHints.${audioStore.currentFormat}`)
})

const hasPendingFiles = computed(() => {
  return audioStore.audioFiles.some((f) => f.status === 'pending' || f.status === 'error')
})

const qualityLabel = computed(() => {
  const quality = audioStore.currentQuality
  if (quality <= 3) return t('conversion.qualityLevels.low')
  if (quality <= 6) return t('conversion.qualityLevels.medium')
  if (quality <= 8) return t('conversion.qualityLevels.high')
  return t('conversion.qualityLevels.maximum')
})

const qualityInfo = computed((): string => {
  const quality = audioStore.currentQuality
  const format = audioStore.currentFormat

  const bitrateMap: Record<string, number[]> = {
    mp3: [64, 96, 128, 160, 192, 224, 256, 320, 320, 320],
    aac: [64, 96, 128, 160, 192, 224, 256, 320, 320, 320],
  }

  if (format === 'mp3' || format === 'aac' || format === 'm4a') {
    const bitrate = bitrateMap[format === 'm4a' ? 'aac' : format][quality - 1]
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

  if (format === 'opus') {
    const opusBitrates = [32, 48, 64, 96, 128, 160, 192, 256, 320, 510]
    return `${opusBitrates[quality - 1]} kbps`
  }

  if (format === 'aiff') {
    if (quality <= 4) return '16-bit PCM'
    if (quality <= 7) return '24-bit PCM'
    return '32-bit PCM'
  }

  if (format === 'wma') {
    const wmaBitrates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
    return `${wmaBitrates[quality - 1]} kbps`
  }

  return ''
})

async function startConversion(): Promise<void> {
  try {
    const { cancelled } = await audioStore.convertAllFiles()
    if (cancelled) {
      showToast('info', t('toast.conversionCancelled'))
    } else {
      showToast('success', t('toast.conversionComplete'))
    }
  } catch (error) {
    showToast('error', t('toast.conversionFailed'), {
      message: (error as Error).message,
    })
  }
}

function cancelConversion(): void {
  audioStore.cancelConversion()
}
</script>

<style scoped>
/* Panel (UiPanel) */
.conversion-settings {
  padding: var(--ds-space-4) var(--ds-space-5) var(--ds-space-5);
}

.settings-title {
  margin-bottom: var(--ds-space-4);
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  margin-bottom: var(--ds-space-5);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

/* Label über dem Feld: 13 px, 500, Text 2; der Wert steht im Label */
.setting-label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
}

.setting-label strong {
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.quality-control {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}

.quality-markers {
  display: flex;
  justify-content: space-between;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

.quality-info,
.format-hint {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  font-variant-numeric: tabular-nums;
}

/* Konvertieren: die Primäraktion der Ansicht; Abbrechen textbasiert darunter */
.btn-cancel {
  margin-top: var(--ds-space-2);
}

@media (max-width: 480px) {
  .conversion-settings {
    padding: var(--ds-space-4);
  }

  .btn-convert {
    min-height: var(--ds-row-height);
  }
}
</style>
