<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/themeStore'
import { setLocale } from '@/locales'
import type { Theme } from '@/types'

const { locale } = useI18n()
const themeStore = useThemeStore()

function onThemeChanged(e: Event): void {
  const newTheme = (e as CustomEvent<{ theme?: string }>).detail?.theme
  if (newTheme && (newTheme === 'light' || newTheme === 'dark') && newTheme !== themeStore.theme) {
    themeStore.setTheme(newTheme as Theme)
  }
}

function onLanguageChanged(e: Event): void {
  const newLang = (e as CustomEvent<{ lang?: string }>).detail?.lang
  if (newLang && (newLang === 'de' || newLang === 'en') && newLang !== locale.value) {
    setLocale(newLang)
  }
}

function initBridge(): void {
  const storedTheme = localStorage.getItem('theme')
  if (
    storedTheme &&
    (storedTheme === 'light' || storedTheme === 'dark') &&
    storedTheme !== themeStore.theme
  ) {
    themeStore.setTheme(storedTheme as Theme)
  }

  window.addEventListener('theme-changed', onThemeChanged)
  window.addEventListener('language-changed', onLanguageChanged)

  const storedLocale = localStorage.getItem('locale')
  if (
    storedLocale &&
    (storedLocale === 'de' || storedLocale === 'en') &&
    storedLocale !== locale.value
  ) {
    setLocale(storedLocale)
  }
}

onMounted(() => {
  // Warten bis SSI-Inhalte geladen sind
  if (document.readyState === 'complete') {
    initBridge()
  } else {
    window.addEventListener('load', initBridge)
  }
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
  window.removeEventListener('language-changed', onLanguageChanged)
  window.removeEventListener('load', initBridge)
})
</script>
