<template>
  <!-- Bridge-Komponente: Synct die globale SSI-Navigation mit dem Vue-App-State -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/themeStore'
import { setLocale } from '@/locales'

const { locale } = useI18n()
const themeStore = useThemeStore()

// --- Theme Bridge ---
// Fängt das 'theme-changed' Event der globalen Navigation ab
// und synchronisiert den Pinia themeStore
function onThemeChanged(e) {
  const newTheme = e.detail?.theme
  if (newTheme && newTheme !== themeStore.theme) {
    themeStore.setTheme(newTheme)
  }
}

// --- Language Bridge ---
// Fängt das 'language-changed' Event der globalen Navigation ab
// und synchronisiert vue-i18n reaktiv (ohne Page-Reload).
// Die globale Nav übersetzt sich selbst via translateNav() und
// dispatcht dann dieses Event – wir müssen nur vue-i18n updaten.
function onLanguageChanged(e) {
  const newLang = e.detail?.lang
  if (newLang && newLang !== locale.value) {
    setLocale(newLang)
  }
}

// --- Initialisierung ---
function initBridge() {
  // Theme-State synchronisieren: globale Nav → themeStore
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme && storedTheme !== themeStore.theme) {
    themeStore.setTheme(storedTheme)
  }

  // Theme-Events der globalen Navigation abfangen
  window.addEventListener('theme-changed', onThemeChanged)

  // Language-Events der globalen Navigation abfangen
  window.addEventListener('language-changed', onLanguageChanged)

  // Initialen Locale synchronisieren (falls localStorage
  // von globaler Nav bereits gesetzt wurde bevor Vue mountet)
  const storedLocale = localStorage.getItem('locale')
  if (storedLocale && storedLocale !== locale.value) {
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
