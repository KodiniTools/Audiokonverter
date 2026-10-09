<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/locales'

// Brücke zur globalen SSI-Navigation (Sprache). Das Theme übernimmt der Theme-Store
// (theme-changed-Event und data-theme auf <html>).
const { locale } = useI18n()

function onLanguageChanged(e: Event): void {
  const newLang = (e as CustomEvent<{ lang?: string }>).detail?.lang
  if (newLang && (newLang === 'de' || newLang === 'en') && newLang !== locale.value) {
    setLocale(newLang)
  }
}

function initBridge(): void {
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
  window.removeEventListener('language-changed', onLanguageChanged)
  window.removeEventListener('load', initBridge)
})
</script>
