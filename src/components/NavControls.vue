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
// Überschreibt die Sprach-Buttons der globalen Navigation,
// damit vue-i18n reaktiv aktualisiert wird (ohne Page-Reload)
function interceptLanguageButtons() {
  const langBtns = document.querySelectorAll('.global-nav-lang-btn')
  if (!langBtns.length) return

  langBtns.forEach(btn => {
    // Button klonen, um die Event-Listener der globalen Nav zu entfernen
    // (die globale Nav macht window.location.reload() beim Sprachwechsel)
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    newBtn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()

      const targetLang = this.getAttribute('data-lang')
      if (targetLang === locale.value) return

      // Vue-i18n reaktiv aktualisieren (kein Page-Reload!)
      setLocale(targetLang)

      // Active-Status der Buttons aktualisieren
      updateLanguageButtons(targetLang)
    })
  })

  // Initialen Active-State setzen (synchron mit Vue-Locale)
  updateLanguageButtons(locale.value)
}

function updateLanguageButtons(lang) {
  const langBtns = document.querySelectorAll('.global-nav-lang-btn')
  langBtns.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang')
    btn.classList.toggle('active', btnLang === lang)
  })
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

  // Sprach-Buttons der globalen Navigation überschreiben
  interceptLanguageButtons()
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
  window.removeEventListener('load', initBridge)
})
</script>
