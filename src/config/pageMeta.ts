import type { Locale, LocaleMeta } from '../utils/localeUrls'

/** Öffentliche URL der deutschen Hauptfassung (Englisch: `?lang=en`). */
export const SITE_URL = 'https://kodinitools.com/audiokonverter/'

/**
 * Titel und Beschreibung je Sprache. Deutsch steht zusätzlich statisch in index.html,
 * Englisch schreibt der Build in dist/index.en.html (siehe utils/localizeHtml.ts).
 * Ohne Laufzeit-Abhängigkeiten, damit vite.config.ts es importieren kann.
 */
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
} as const satisfies Record<Locale, LocaleMeta>
