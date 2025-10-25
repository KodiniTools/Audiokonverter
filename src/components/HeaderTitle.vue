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
  margin: 3rem 0 2rem;
  animation: fadeInDown 0.6s ease;
}

.main-title {
  font-size: 3rem;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.main-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  font-weight: 400;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .header-title {
    margin: 2rem 0 1.5rem;
  }

  .main-title {
    font-size: 2rem;
  }

  .main-subtitle {
    font-size: 1rem;
  }
}
</style>
