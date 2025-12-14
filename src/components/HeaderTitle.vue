<template>
  <div class="header-title">
    <h1 class="main-title">{{ t('app.title') }}</h1>
    <p class="main-subtitle">{{ t('app.subtitle') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.header-title {
  text-align: center;
  margin: 1.5rem 0 1rem;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.main-title {
  font-size: 2rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.main-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 400;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  70% {
    transform: scale(1.02) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 768px) {
  .header-title {
    margin: 1rem 0 0.75rem;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .main-subtitle {
    font-size: 0.85rem;
  }
}
</style>
