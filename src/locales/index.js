import { createI18n } from 'vue-i18n'
import de from './de.js'
import en from './en.js'

// Nutze gleichen Key wie die globale SSI-Navigation
const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language.split('-')[0]
const defaultLocale = savedLocale || (browserLocale === 'de' ? 'de' : 'en')

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    de,
    en
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false
})

// Funktion zum Wechseln der Sprache (gleicher Key wie globale SSI-Navigation)
export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.setAttribute('lang', locale)
}

export default i18n
