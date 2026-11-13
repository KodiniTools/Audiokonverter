import { describe, expect, it } from 'vitest'
import de from '@/locales/de'
import en from '@/locales/en'

/** Alle Blatt-Einträge als `pfad.zum.schlüssel` → Text. */
function flatten(node: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>()
  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      for (const [path, leaf] of flatten(value, prefix ? `${prefix}.${key}` : key)) {
        out.set(path, leaf)
      }
    }
  } else {
    out.set(prefix, node)
  }
  return out
}

describe('Übersetzungen', () => {
  const deEntries = flatten(de)
  const enEntries = flatten(en)

  it('haben in de und en dieselben Schlüssel', () => {
    expect([...enEntries.keys()].sort()).toEqual([...deEntries.keys()].sort())
  })

  it('enthalten nur nicht-leere Texte', () => {
    for (const [locale, entries] of [
      ['de', deEntries],
      ['en', enEntries],
    ] as const) {
      for (const [path, value] of entries) {
        expect(typeof value, `${locale}: ${path}`).toBe('string')
        expect((value as string).trim(), `${locale}: ${path}`).not.toBe('')
      }
    }
  })

  it('haben dieselbe Zahl an Pluralformen', () => {
    for (const [path, value] of deEntries) {
      const forms = (text: unknown) => String(text).split(' | ').length
      expect(forms(enEntries.get(path)), path).toBe(forms(value))
    }
  })
})
