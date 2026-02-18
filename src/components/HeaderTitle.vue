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
  margin: 0 0 1.25rem;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 1;
}

.main-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #F5F4D6;
  margin-bottom: 0.35rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.main-subtitle {
  font-size: 1rem;
  color: rgba(245, 244, 214, 0.75);
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
    margin: 0 0 1rem;
  }

  .main-title {
    font-size: 1.75rem;
  }

  .main-subtitle {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .header-title {
    margin: 0 0 0.75rem;
  }

  .main-title {
    font-size: 1.5rem;
    word-break: break-word;
  }

  .main-subtitle {
    font-size: 0.8rem;
  }
}
</style>
