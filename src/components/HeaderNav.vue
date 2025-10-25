<template>
  <nav class="navbar">
    <div class="nav-container">
      <a href="#" class="nav-brand" @click.prevent="scrollToTop">
        <i class="fas fa-music"></i>
        <span>{{ t('app.title') }}</span>
      </a>

      <div class="nav-actions">
        <button 
          class="nav-btn language-toggle" 
          @click="toggleLanguage"
          :title="t('nav.language')"
        >
          <span class="current-lang">{{ currentLocale.toUpperCase() }}</span>
          <i class="fas fa-globe"></i>
        </button>

        <button 
          class="nav-btn theme-toggle" 
          @click="themeStore.toggleTheme()"
          :title="t('nav.toggleTheme')"
        >
          <i :class="themeStore.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/themeStore'
import { setLocale } from '@/locales'

const { t, locale } = useI18n()
const themeStore = useThemeStore()

const currentLocale = computed(() => locale.value)

function toggleLanguage() {
  const newLocale = locale.value === 'de' ? 'en' : 'de'
  setLocale(newLocale)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  /* z-index von 1000 auf 100 reduziert */
  z-index: 100; 
  background: var(--card-background);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(184, 184, 184, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-brand:hover {
  transform: translateY(-2px);
}

.nav-brand i {
  font-size: 1.75rem;
}

.nav-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.nav-btn {
  background: transparent;
  border: 2px solid rgba(144, 144, 144, 0.2);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.current-lang {
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0.75rem 1rem;
  }

  .nav-brand span {
    display: none;
  }

  .nav-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
}
</style>