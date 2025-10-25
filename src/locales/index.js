import { createI18n } from 'vue-i18n'
import de from './de.js'
import en from './en.js'

// Prüfe gespeicherte Sprache oder nutze Browser-Sprache
const savedLocale = localStorage.getItem('audio-converter-locale')
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

// Funktion zum Wechseln der Sprache
export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('audio-converter-locale', locale)
  document.documentElement.setAttribute('lang', locale)
}

export default i18n
