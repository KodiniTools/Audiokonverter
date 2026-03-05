import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n, { setLocale } from './locales'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

app.mount('#app')

// Auf Sprachwechsel aus der globalen SSI-Navigation reagieren
window.addEventListener('locale-changed', (e) => {
  const locale = e.detail?.locale
  if (locale && (locale === 'de' || locale === 'en')) {
    setLocale(locale)
  }
})
