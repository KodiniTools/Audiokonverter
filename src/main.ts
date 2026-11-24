import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './design-system/tokens-v2.css'
import './assets/styles/main.css'
import './assets/styles/audio-layout.css'
import i18n, { setLocale } from './locales/index.ts'
import { useThemeStore } from './stores/themeStore'

const pinia = createPinia()

if (document.documentElement.dataset.audioPage === 'app') {
  void import('./App.vue').then(({ default: App }) => {
    const app = createApp(App)
    app.use(pinia)
    app.use(i18n)
    app.mount('#app')
  })
} else {
  useThemeStore(pinia)
}

window.addEventListener('locale-changed', (e) => {
  const locale = (e as CustomEvent<{ locale?: string }>).detail?.locale
  if (locale === 'de' || locale === 'en') {
    setLocale(locale)
  }
})
