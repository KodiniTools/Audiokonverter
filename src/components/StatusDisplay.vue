<template>
  <div v-if="audioStore.hasConvertedFiles" class="status-display">
    <div class="completion-banner">
      <span class="completion-check" aria-hidden="true">&#10003;</span>
      <span class="completion-label">{{ t('status.completed') }}!</span>
      <span class="completion-detail">{{ t('status.completedOf', { completed: completedCount, total: audioStore.fileCount }) }}</span>
    </div>

    <!-- Next-Step Wizard -->
    <div v-if="workflowStore.isCompletedStep" class="wizard">
      <h4 class="wizard-title">{{ t('wizard.title') }}</h4>

      <div class="wizard-grid">
        <!-- Playlist Generator -->
        <button
          class="wizard-card"
          @click="shareAndOpen('playlist', 'https://kodinitools.com/playlist_generator/app')"
          :disabled="isBusy"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'playlist' ? t('wizard.preparing') : t('wizard.playlist') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.playlistDesc') }}</span>
        </button>

        <!-- Audio Visualizer -->
        <button
          class="wizard-card"
          @click="shareAndOpen('visualizer', 'https://kodinitools.com/visualizer/')"
          :disabled="isBusy"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'visualizer' ? t('wizard.preparing') : t('wizard.visualizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.visualizerDesc') }}</span>
        </button>

        <!-- Audio Normalizer -->
        <button
          class="wizard-card"
          @click="shareAndOpen('normalizer', 'https://kodinitools.com/audionormalisierer/')"
          :disabled="isBusy"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'normalizer' ? t('wizard.preparing') : t('wizard.normalizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.normalizerDesc') }}</span>
        </button>

        <!-- Equalizer 19 -->
        <button
          class="wizard-card"
          @click="shareAndOpen('equalizer', 'https://kodinitools.com/equaliser19/')"
          :disabled="isBusy"
        >
          <span class="wizard-card-label">
            {{ preparingTool === 'equalizer' ? t('wizard.preparing') : t('wizard.equalizer') }}
          </span>
          <span class="wizard-card-desc">{{ t('wizard.equalizerDesc') }}</span>
        </button>
      </div>

      <button class="wizard-reset" @click="startNew">
        {{ t('wizard.newFiles') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useToast } from '@/composables/useToast'
import { shareFiles } from '@/services/SharedFileRepository'

const { t } = useI18n()
const audioStore = useAudioStore()
const workflowStore = useWorkflowStore()
const { showToast } = useToast()

const preparingTool = ref(null)

const isBusy = computed(() => preparingTool.value !== null)

const completedCount = computed(() => {
  return audioStore.audioFiles.filter(f => f.status === 'completed').length
})

/** Collect converted blobs from the store. */
async function collectConvertedBlobs() {
  const completedFiles = audioStore.audioFiles.filter(
    f => f.status === 'completed' && f.convertedUrl
  )
  const entries = []
  for (const f of completedFiles) {
    const response = await fetch(f.convertedUrl)
    const blob = await response.blob()
    entries.push({ name: f.convertedName || f.name, blob })
  }
  return entries
}

/** Store files in IndexedDB, then open the target tool. */
async function shareAndOpen(toolKey, toolUrl) {
  const completedFiles = audioStore.audioFiles.filter(
    f => f.status === 'completed' && f.convertedUrl
  )
  if (completedFiles.length === 0) return

  preparingTool.value = toolKey
  try {
    const entries = await collectConvertedBlobs()
    await shareFiles(entries)
    window.open(`${toolUrl}?source=audiokonverter`, '_blank', 'noopener')
    showToast('success', t('wizard.shareSuccess', { count: entries.length }))
  } catch (error) {
    showToast('error', t('wizard.shareFailed'))
  } finally {
    preparingTool.value = null
  }
}

function startNew() {
  audioStore.clearAllFiles()
}
</script>

<style scoped>
.status-display {
  margin: 1rem 0;
  animation: slideInUp 0.4s ease;
}

.completion-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--success-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

.completion-check {
  color: var(--success-color);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
}

.completion-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--success-color);
}

.completion-detail {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ── Next-Step Wizard ────────────────────────────────────────────── */
.wizard {
  margin-top: 0.75rem;
  animation: slideInUp 0.4s ease 0.1s both;
}

.wizard-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 0.75rem;
}

.wizard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.wizard-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0.75rem;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--glass-shadow);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

.wizard-card:hover:not(:disabled) {
  border-color: var(--primary-color);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(1, 79, 153, 0.15);
}

.wizard-card:disabled {
  opacity: 0.6;
  cursor: wait;
}

.wizard-card-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.2rem;
}

.wizard-card-desc {
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.wizard-reset {
  display: block;
  margin: 1rem auto 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.wizard-reset:hover {
  color: var(--primary-color);
  background: rgba(1, 79, 153, 0.08);
}

/* ── Animations ─────────────────────────────────────────────────── */
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

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .wizard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .completion-banner {
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
  }

  .completion-label {
    font-size: 0.8rem;
  }

  .completion-detail {
    font-size: 0.7rem;
  }

  .wizard-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .wizard-card {
    padding: 0.75rem 0.5rem;
    border-radius: 10px;
  }

  .wizard-card-label {
    font-size: 0.75rem;
  }

  .wizard-card-desc {
    font-size: 0.65rem;
  }

  .wizard-reset {
    font-size: 0.75rem;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
