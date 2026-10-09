<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <div class="toast-content">
          <div class="toast-message">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p v-if="toast.message" class="toast-text">{{ toast.message }}</p>
          </div>

          <button
            v-if="toast.closeable"
            class="btn-icon toast-close"
            aria-label="Close"
            title="Close"
            @click="removeToast(toast.id)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div v-if="toast.actions && toast.actions.length" class="toast-actions">
          <button
            v-for="(action, index) in toast.actions"
            :key="index"
            class="btn"
            :class="index === 0 ? 'btn-primary' : 'btn-secondary'"
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

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: var(--ds-space-5);
  z-index: var(--ds-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  width: 380px;
  max-width: calc(100vw - 2 * var(--ds-space-4));
  pointer-events: none;
}

/* Toast (UiToast): Fläche 1, Hairline, Overlay-Schatten, 3-px-Statuslinie links */
.toast {
  position: relative;
  overflow: hidden;
  padding: var(--ds-space-3) var(--ds-space-3) var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-left: 3px solid var(--toast-status);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-overlay);
  pointer-events: auto;
  word-wrap: break-word;
}

.toast-success {
  --toast-status: var(--ds-success);
}

.toast-error {
  --toast-status: var(--ds-danger);
}

.toast-warning {
  --toast-status: var(--ds-warning);
}

.toast-info {
  --toast-status: var(--ds-info);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
}

.toast-message {
  flex: 1;
  min-width: 0;
  color: var(--ds-text);
}

.toast-title {
  display: block;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
}

.toast-text {
  margin-top: var(--ds-space-1);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}

.toast-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}

.toast-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
}

.toast-progress-fill {
  width: 100%;
  height: 100%;
  background: var(--toast-status);
}

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Ein- und Ausblenden: Fade plus 16 px von rechts in --ds-duration-slow */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 768px) {
  .toast-container {
    top: var(--ds-space-2);
    right: var(--ds-space-2);
    left: var(--ds-space-2);
    width: auto;
    max-width: none;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-16px);
  }
}
</style>
