import { createI18n } from 'vue-i18n'
import de from './de.js'
import en from './en.js'

const savedLocale = localStorage.getItem('locale')
const browserLocale = navigator.language.split('-')[0]
const defaultLocale = savedLocale ?? (browserLocale === 'de' ? 'de' : 'en')

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: { de, en },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
})

export type Locale = 'de' | 'en'

export function setLocale(locale: Locale): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.setAttribute('lang', locale)
}

export default i18n
