import { createI18n } from 'vue-i18n'
import de from './de'
import en from './en'
import { applyLocaleHead, resolveInitialLocale, type Locale } from '../utils/localeSeo'
import { PAGE_META, SITE_URL } from '../config/pageMeta'

export { PAGE_META, SITE_URL }

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem('locale')
  } catch {
    return null
  }
}

// ?lang=en (hreflang-Ziel) hat Vorrang; das Ergebnis wird für die SSI-Navigation gespeichert.
const defaultLocale = resolveInitialLocale(globalThis.location?.search ?? '', readStoredLocale())
try {
  localStorage.setItem('locale', defaultLocale)
} catch {
  // Speicher gesperrt: Sprache gilt nur für diesen Aufruf.
}
applyLocaleHead(SITE_URL, defaultLocale, PAGE_META[defaultLocale])

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: { de, en },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
})

export type { Locale }

export function setLocale(locale: Locale): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem('locale', locale)
  applyLocaleHead(SITE_URL, locale, PAGE_META[locale])
}

export default i18n
