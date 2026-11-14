import { createI18n } from 'vue-i18n'
import de from './de'
import en from './en'
import { applyLocaleHead, resolveInitialLocale, type Locale } from '../utils/localeSeo'

export const SITE_URL = 'https://kodinitools.com/audiokonverter/'

/** Titel und Beschreibung je Sprache (Deutsch steht zusätzlich statisch in index.html). */
export const PAGE_META = {
  de: {
    title: 'MP3 in WAV umwandeln – Audio Konverter online | KodiniTools',
    description:
      'MP3 in WAV umwandeln und umgekehrt, kostenlos online. Audioformat ändern zwischen MP3, WAV, FLAC, OGG, AAC, M4A und OPUS. Ohne Registrierung.',
  },
  en: {
    title: 'Convert MP3 to WAV – Online Audio Converter | KodiniTools',
    description:
      'Convert MP3 to WAV and back for free online. Change audio format between MP3, WAV, FLAC, OGG, AAC, M4A and OPUS. No sign-up required.',
  },
} as const

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
