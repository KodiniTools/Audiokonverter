<template>
  <div v-if="audioStore.hasFiles" class="global-actions">
    <div class="actions-grid">
      <!-- Clear All -->
      <button
        class="action-btn btn-secondary"
        @click="clearAll"
        :title="t('actions.clearAll')"
      >
        <i class="fas fa-trash-alt"></i>
        <span>{{ t('actions.clearAll') }}</span>
      </button>

      <!-- Download All -->
      <button
        v-if="audioStore.hasConvertedFiles"
        class="action-btn btn-success"
        @click="downloadAll"
        :title="t('actions.downloadAll')"
      >
        <i class="fas fa-download"></i>
        <span>{{ t('actions.downloadAll') }}</span>
      </button>

      <!-- Undo -->
      <button
        class="action-btn btn-secondary"
        @click="audioStore.undo()"
        :disabled="!audioStore.canUndo"
        :title="t('actions.undo')"
      >
        <i class="fas fa-undo"></i>
        <span>{{ t('actions.undo') }}</span>
      </button>

      <!-- Redo -->
      <button
        class="action-btn btn-secondary"
        @click="audioStore.redo()"
        :disabled="!audioStore.canRedo"
        :title="t('actions.redo')"
      >
        <i class="fas fa-redo"></i>
        <span>{{ t('actions.redo') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast, showConfirmToast } = useToast()

async function clearAll() {
  const confirmed = await showConfirmToast(
    'warning',
    t('actions.clearAll'),
    'Möchten Sie wirklich alle Dateien löschen?'
  )
  
  if (confirmed) {
    audioStore.clearAllFiles()
    showToast('info', t('toast.allFilesCleared'))
  }
}

async function downloadAll() {
  try {
    await audioStore.downloadAllFiles()
    showToast('success', 'Download gestartet')
  } catch (error) {
    showToast('error', 'Download fehlgeschlagen', { message: error.message })
  }
}
</script>

<style scoped>
.global-actions {
  margin: 2rem 0;
  animation: fadeIn 0.5s ease;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(144, 144, 144, 0.1);
  color: var(--text-color);
  border: 2px solid rgba(144, 144, 144, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(144, 144, 144, 0.2);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr 1fr;
  }

  .action-btn span {
    font-size: 0.875rem;
  }
}
</style>
