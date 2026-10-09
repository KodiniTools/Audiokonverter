<template>
  <div v-if="audioStore.hasConvertedFiles" class="status-display">
    <div class="completion-banner" role="status">
      <svg
        class="completion-check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span class="completion-label">{{ t('status.completed') }}!</span>
      <span class="completion-detail">{{
        t('status.completedOf', { completed: completedCount, total: audioStore.fileCount })
      }}</span>
    </div>

    <!-- Next-Step Wizard -->
    <div v-if="workflowStore.isCompletedStep" class="wizard">
      <h4 class="wizard-title">{{ t('wizard.title') }}</h4>

      <div class="wizard-grid">
        <!-- Playlist Generator -->
        <button
          class="wizard-card"
          :disabled="isBusy"
          @click="shareAndOpen('playlist', 'https://kodinitools.com/playlist_generator/app')"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'playlist' ? t('wizard.preparing') : t('wizard.playlist') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.playlistDesc') }}</span>
        </button>

        <!-- Audio Visualizer -->
        <button
          class="wizard-card"
          :disabled="isBusy"
          @click="shareAndOpen('visualizer', 'https://kodinitools.com/visualizer/')"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'visualizer' ? t('wizard.preparing') : t('wizard.visualizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.visualizerDesc') }}</span>
        </button>

        <!-- Audio Normalizer -->
        <button
          class="wizard-card"
          :disabled="isBusy"
          @click="shareAndOpen('normalizer', 'https://kodinitools.com/audionormalisierer/')"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'normalizer' ? t('wizard.preparing') : t('wizard.normalizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.normalizerDesc') }}</span>
        </button>

        <!-- Equalizer 19 -->
        <button
          class="wizard-card"
          :disabled="isBusy"
          @click="shareAndOpen('equalizer', 'https://kodinitools.com/equaliser19/')"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'equalizer' ? t('wizard.preparing') : t('wizard.equalizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.equalizerDesc') }}</span>
        </button>
      </div>

      <button class="btn btn-ghost wizard-reset" @click="startNew">
        {{ t('wizard.newFiles') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useToast } from '@/composables/useToast'
import { shareFiles } from '@/services/SharedFileRepository'
import type { SharedFileInput } from '@/types'

const { t } = useI18n()
const audioStore = useAudioStore()
const workflowStore = useWorkflowStore()
const { showToast } = useToast()

const preparingTool = ref<string | null>(null)

const isBusy = computed(() => preparingTool.value !== null)

const completedCount = computed(() => {
  return audioStore.audioFiles.filter((f) => f.status === 'completed').length
})

async function collectConvertedBlobs(): Promise<SharedFileInput[]> {
  const completedFiles = audioStore.audioFiles.filter(
    (f) => f.status === 'completed' && f.convertedUrl
  )
  const entries: SharedFileInput[] = []
  for (const f of completedFiles) {
    const response = await fetch(f.convertedUrl!)
    const blob = await response.blob()
    entries.push({ name: f.convertedName || f.name, blob })
  }
  return entries
}

async function shareAndOpen(toolKey: string, toolUrl: string): Promise<void> {
  const completedFiles = audioStore.audioFiles.filter(
    (f) => f.status === 'completed' && f.convertedUrl
  )
  if (completedFiles.length === 0) return

  preparingTool.value = toolKey
  try {
    const entries = await collectConvertedBlobs()
    await shareFiles(entries)
    window.open(`${toolUrl}?source=audiokonverter`, '_blank', 'noopener')
    showToast('success', t('wizard.shareSuccess', { count: entries.length }))
  } catch {
    showToast('error', t('wizard.shareFailed'))
  } finally {
    preparingTool.value = null
  }
}

function startNew(): void {
  audioStore.clearAllFiles()
}
</script>

<style scoped>
.status-display {
  margin: var(--ds-space-4) 0;
}

/* Callout (UiCallout): Eingabefläche, Hairline, Status nur im Icon */
.completion-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}

.completion-check {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  flex-shrink: 0;
  color: var(--ds-success);
}

.completion-label {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.completion-detail {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}

/* Nächster Schritt: Karten auf Fläche 1, Hover nur Rahmen */
.wizard {
  margin-top: var(--ds-space-5);
}

.wizard-title {
  margin-bottom: var(--ds-space-3);
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
  text-align: center;
}

.wizard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);
}

.wizard-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--ds-duration) var(--ds-ease);
}

.wizard-card:hover:not(:disabled) {
  border-color: var(--ds-border-strong);
}

.wizard-card:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.wizard-card:disabled {
  opacity: 0.45;
  cursor: wait;
}

.wizard-card-label {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.wizard-card-desc {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}

.wizard-reset {
  display: flex;
  margin: var(--ds-space-4) auto 0;
}

@media (max-width: 768px) {
  .wizard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .wizard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
