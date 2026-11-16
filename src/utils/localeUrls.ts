// Sprachfassungen als eigene URLs: Deutsch ohne Parameter, Englisch mit ?lang=en.
// Ohne DOM-Abhängigkeit, damit auch der Build (vite.config.ts) diese Regeln nutzt.

export type Locale = 'de' | 'en'

export interface LocaleMeta {
  title: string
  description: string
}

export const isLocale = (value: unknown): value is Locale => value === 'de' || value === 'en'

/** Startsprache: ?lang=de|en, dann gespeicherte Wahl, sonst Deutsch. */
export function resolveInitialLocale(search: string, stored: string | null | undefined): Locale {
  const fromUrl = new URLSearchParams(search).get('lang')
  if (isLocale(fromUrl)) return fromUrl
  return isLocale(stored) ? stored : 'de'
}

/** Absolute URL einer Seite in der gewünschten Sprache. */
export function localizedUrl(baseUrl: string, locale: Locale): string {
  return locale === 'en' ? `${baseUrl}?lang=en` : baseUrl
}

/** Canonical und hreflang-Ziele (de, en, x-default = de) für eine Seite. */
export function localeUrls(baseUrl: string, locale: Locale) {
  return {
    canonical: localizedUrl(baseUrl, locale),
    alternates: [
      { hreflang: 'de', href: localizedUrl(baseUrl, 'de') },
      { hreflang: 'en', href: localizedUrl(baseUrl, 'en') },
      { hreflang: 'x-default', href: localizedUrl(baseUrl, 'de') },
    ],
  }
}

/** og:locale-Werte (Hauptsprache und Alternative) für eine Sprache. */
export function ogLocales(locale: Locale): { locale: string; alternate: string } {
  return locale === 'de'
    ? { locale: 'de_DE', alternate: 'en_US' }
    : { locale: 'en_US', alternate: 'de_DE' }
}
