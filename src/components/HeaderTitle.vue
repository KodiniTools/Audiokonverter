<template>
  <div class="header-title">
    <h1 class="main-title">{{ t('app.title') }}</h1>
    <p class="main-subtitle">{{ t('app.subtitle') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.header-title {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin: 0 0 var(--ds-space-6);
  text-align: center;
}

/* Hero-H1: 32 px fett, eng gesetzt (mobil 24 px) */
.main-title {
  font-size: var(--ds-text-3xl);
  font-weight: var(--ds-weight-bold);
  letter-spacing: var(--ds-tracking-tight);
  color: var(--ds-text);
}

.main-subtitle {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
}

@media (max-width: 768px) {
  .header-title {
    margin: 0 0 var(--ds-space-4);
  }

  .main-title {
    font-size: var(--ds-text-2xl);
    word-break: break-word;
  }

  .main-subtitle {
    font-size: var(--ds-text-md);
  }
}
</style>
