import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n, { setLocale } from './locales/index.ts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

app.mount('#app')

window.addEventListener('locale-changed', (e) => {
  const locale = (e as CustomEvent<{ locale?: string }>).detail?.locale
  if (locale === 'de' || locale === 'en') {
    setLocale(locale)
  }
})
