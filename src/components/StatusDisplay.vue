<template>
  <div v-if="audioStore.hasConvertedFiles" class="status-display">
    <div class="completion-message">
      <i class="fas fa-check-circle success-icon"></i>
      <div class="completion-text">
        <h3>{{ t('status.completed') }}!</h3>
        <p>{{ completedCount }} {{ t('upload.filesSelected', { count: completedCount }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'

const { t } = useI18n()
const audioStore = useAudioStore()

const completedCount = computed(() => {
  return audioStore.audioFiles.filter(f => f.status === 'completed').length
})
</script>

<style scoped>
.status-display {
  margin: 2rem 0;
  animation: slideInUp 0.5s ease;
}

.completion-message {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
  border: 2px solid var(--success-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  font-size: 3rem;
  color: var(--success-color);
  animation: scaleIn 0.5s ease;
}

.completion-text h3 {
  font-size: 1.5rem;
  color: var(--success-color);
  margin-bottom: 0.25rem;
}

.completion-text p {
  font-size: 1rem;
  color: var(--text-secondary);
}

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

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .status-display {
    margin: 1.5rem 0;
  }

  .completion-message {
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .success-icon {
    font-size: 2.25rem;
  }

  .completion-text h3 {
    font-size: 1.25rem;
  }

  .completion-text p {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .status-display {
    margin: 1rem 0;
  }

  .completion-message {
    padding: 1rem;
    gap: 0.6rem;
    border-radius: 10px;
  }

  .success-icon {
    font-size: 1.75rem;
  }

  .completion-text h3 {
    font-size: 1.1rem;
  }

  .completion-text p {
    font-size: 0.8rem;
  }
}
</style>
