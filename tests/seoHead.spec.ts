import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8')
const head = new DOMParser().parseFromString(html, 'text/html').head
const attr = (selector: string, name: string): string | null | undefined =>
  head.querySelector(selector)?.getAttribute(name)

const PAGE_URL = 'https://kodinitools.com/audiokonverter/'

describe('index.html SEO-Kopf', () => {
  it('Canonical und og:url zeigen auf die eigene Tool-URL', () => {
    expect(head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(attr('link[rel="canonical"]', 'href')).toBe(PAGE_URL)
    expect(attr('meta[property="og:url"]', 'content')).toBe(PAGE_URL)
  })

  it('Titel und Beschreibung nennen das Haupt-Keyword und halten die Länge ein', () => {
    const title = head.querySelector('title')?.textContent ?? ''
    const description = attr('meta[name="description"]', 'content') ?? ''
    expect(title).toMatch(/^Audio Konverter/)
    expect(title.length).toBeLessThanOrEqual(70)
    expect(description.length).toBeGreaterThanOrEqual(120)
    expect(description.length).toBeLessThanOrEqual(160)
  })
})
