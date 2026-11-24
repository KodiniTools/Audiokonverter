import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import './design-system/tokens-v2.css'
import './assets/styles/main.css'
import './assets/styles/audio-layout.css'
import './assets/styles/audio-header.css'
import './assets/styles/audio-controls.css'
import i18n, { setLocale } from './locales/index.ts'
import { useThemeStore } from './stores/themeStore'

const pinia = createPinia()
const themeStore = useThemeStore(pinia)

// Lokaler Vite-Test: Ohne SSI-Navigation fehlt der globale Theme-Umschalter. Dann übernimmt
// ein eigener Dunkelmodus-Schalter in der Audio-Konverter-Navigation; beide nutzen denselben
// Store und damit dieselbe gespeicherte Einstellung (localStorage.theme).
const themeFallback = document.getElementById('audio-theme-fallback')
const themeToggle = document.getElementById('audio-theme-toggle')
if (themeFallback && themeToggle && !document.querySelector('.global-nav-theme-icon')) {
  watch(
    () => themeStore.theme,
    (theme) => themeToggle.setAttribute('aria-pressed', String(theme === 'dark')),
    { immediate: true }
  )
  themeToggle.addEventListener('click', () => themeStore.toggleTheme())
  themeFallback.hidden = false
}

if (document.documentElement.dataset.audioPage === 'app') {
  void import('./App.vue').then(({ default: App }) => {
    const app = createApp(App)
    app.use(pinia)
    app.use(i18n)
    app.mount('#app')
  })
}

window.addEventListener('locale-changed', (e) => {
  const locale = (e as CustomEvent<{ locale?: string }>).detail?.locale
  if (locale === 'de' || locale === 'en') {
    setLocale(locale)
  }
})
