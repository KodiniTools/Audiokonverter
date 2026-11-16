// Schreibt die Sprachfassung (siehe localeUrls.ts) zur Laufzeit in den Head.
// Canonical und hreflang zeigen auf die Sprach-URLs; beim Start hat ?lang Vorrang vor der
// gespeicherten Sprache, damit Googlebot (ohne Speicher) unter ?lang=en Englisch sieht.

import { localeUrls, ogLocales, type Locale, type LocaleMeta } from './localeUrls'

export {
  isLocale,
  localeUrls,
  localizedUrl,
  resolveInitialLocale,
  type Locale,
  type LocaleMeta,
} from './localeUrls'

function upsert(
  doc: Document,
  selector: string,
  tag: string,
  attrs: Record<string, string>
): Element {
  let el = doc.head.querySelector(selector)
  if (!el) {
    el = doc.createElement(tag)
    doc.head.appendChild(el)
  }
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  return el
}

/**
 * Schreibt Sprache, Canonical, hreflang und (optional) Titel/Beschreibung in den Head.
 * Open-Graph-Tags werden nur aktualisiert, wenn sie im HTML vorhanden sind.
 */
export function applyLocaleHead(
  baseUrl: string,
  locale: Locale,
  meta?: LocaleMeta,
  doc: Document | undefined = globalThis.document
): void {
  if (!doc) return
  const { canonical, alternates } = localeUrls(baseUrl, locale)
  doc.documentElement.setAttribute('lang', locale)
  upsert(doc, 'link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical })
  for (const { hreflang, href } of alternates) {
    upsert(doc, `link[rel="alternate"][hreflang="${hreflang}"]`, 'link', {
      rel: 'alternate',
      hreflang,
      href,
    })
  }
  doc.head.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical)
  const og = ogLocales(locale)
  doc.head.querySelector('meta[property="og:locale"]')?.setAttribute('content', og.locale)
  doc.head
    .querySelector('meta[property="og:locale:alternate"]')
    ?.setAttribute('content', og.alternate)
  if (!meta) return
  doc.title = meta.title
  upsert(doc, 'meta[name="description"]', 'meta', {
    name: 'description',
    content: meta.description,
  })
  doc.head.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title)
  doc.head
    .querySelector('meta[property="og:description"]')
    ?.setAttribute('content', meta.description)
  doc.head.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.title)
  doc.head
    .querySelector('meta[name="twitter:description"]')
    ?.setAttribute('content', meta.description)
}
