<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
      >
        <div class="toast-content">
          <div class="toast-message">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p v-if="toast.message" class="toast-text">{{ toast.message }}</p>
          </div>

          <button
            v-if="toast.closeable"
            class="toast-close"
            @click="removeToast(toast.id)"
            aria-label="Close"
          >&times;</button>
        </div>

        <div v-if="toast.actions && toast.actions.length" class="toast-actions">
          <button
            v-for="(action, index) in toast.actions"
            :key="index"
            class="toast-action-btn"
            @click="action.callback"
          >
            {{ action.label }}
          </button>
        </div>

        <div v-if="toast.duration > 0" class="toast-progress">
          <div
            class="toast-progress-fill"
            :style="{ animation: `progressBar ${toast.duration}ms linear` }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  pointer-events: auto;
  max-width: 100%;
  word-wrap: break-word;
}

.toast-success {
  border-left: 4px solid var(--success-color);
}

.toast-error {
  border-left: 4px solid var(--error-color);
}

.toast-warning {
  border-left: 4px solid #ffa726;
}

.toast-info {
  border-left: 4px solid var(--primary-color);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.toast-message {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--text-color);
}

.toast-title {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.toast-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.toast-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.toast-action-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast-action-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  border-radius: 0 0 12px 12px;
}

.toast-progress-fill {
  height: 100%;
  background: var(--primary-color);
  width: 100%;
}

.toast-success .toast-progress-fill {
  background: var(--success-color);
}

.toast-error .toast-progress-fill {
  background: var(--error-color);
}

.toast-warning .toast-progress-fill {
  background: #ffa726;
}

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .toast {
    padding: 0.875rem;
  }

  .toast-message {
    font-size: 0.9rem;
  }

  /* On mobile, slide from top instead of right to avoid horizontal overflow */
  .toast-enter-from {
    opacity: 0;
    transform: translateY(-100%);
  }

  .toast-leave-to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

@media (max-width: 480px) {
  .toast-container {
    top: 8px;
    right: 8px;
    left: 8px;
    gap: 0.5rem;
  }

  .toast {
    padding: 0.75rem;
    border-radius: 10px;
  }

  .toast-content {
    gap: 0.6rem;
  }

  .toast-message {
    font-size: 0.85rem;
  }

  .toast-title {
    font-size: 0.85rem;
    margin-bottom: 0.15rem;
  }

  .toast-text {
    font-size: 0.78rem;
  }

  .toast-action-btn {
    padding: 0.45rem 0.65rem;
    font-size: 0.8rem;
    min-height: 36px;
  }
}
</style>
