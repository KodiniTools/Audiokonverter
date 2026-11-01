import { createI18n } from 'vue-i18n'
import de from './de.js'
import en from './en.js'
import { applyLocaleHead, resolveInitialLocale, type Locale } from '../utils/localeSeo'

export const SITE_URL = 'https://kodinitools.com/audiokonverter/'

/** Titel und Beschreibung je Sprache (Deutsch steht zusätzlich statisch in index.html). */
export const PAGE_META = {
  de: {
    title: 'Audio Konverter online – MP3, WAV, FLAC umwandeln | KodiniTools',
    description:
      'Audiodateien kostenlos online umwandeln: MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, AIFF und WMA. Ohne Registrierung, kleine Dateien bleiben im Browser.',
  },
  en: {
    title: 'Online Audio Converter – Convert MP3, WAV, FLAC | KodiniTools',
    description:
      'Convert audio files online for free: MP3, WAV, FLAC, OGG, AAC, M4A, OPUS, AIFF and WMA. No sign-up, small files stay in your browser.',
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
