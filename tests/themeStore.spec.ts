/**
 * Theme-Store: Mechanik wie im Collage Maker (src/stores/settings.ts) und im MP3 Konverter
 * (tests/theme.store.spec.js, ohne dessen Kontrast-Themes).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { NAV_THEME_ICONS, isTheme, useThemeStore } from '@/stores/themeStore'

const html = (): string | null => document.documentElement.getAttribute('data-theme')
const icons = (): (string | null)[] =>
  [...document.querySelectorAll('.global-nav-theme-icon')].map((el) => el.textContent)

/** Wartet auf Vue-Watcher und MutationObserver (beide laufen als Microtask). */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Theme-Store', () => {
  let store: ReturnType<typeof useThemeStore> | undefined

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
    document.body.className = ''
    document.body.innerHTML =
      '<span class="global-nav-theme-icon"></span><span class="global-nav-theme-icon" id="globalNavThemeIcon"></span>'
    setActivePinia(createPinia())
  })

  afterEach(() => {
    store?.cleanup()
    store = undefined
  })

  it('startet ohne Speicher hell und schreibt das Schema nach localStorage.theme', () => {
    store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(html()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('übernimmt ein gespeichertes dunkles Theme', () => {
    localStorage.setItem('theme', 'dark')
    store = useThemeStore()
    expect(store.theme).toBe('dark')
    expect(html()).toBe('dark')
  })

  it('fällt bei unbekannten Speicherwerten auf hell zurück', () => {
    localStorage.setItem('theme', 'blau')
    store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('hell: body.light-theme, kein html.dark, Mond in allen Nav-Icons', () => {
    store = useThemeStore()
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(icons()).toEqual([NAV_THEME_ICONS.light, NAV_THEME_ICONS.light])
  })

  it('dunkel: html.dark, kein body.light-theme, Sonne', async () => {
    store = useThemeStore()
    store.toggleTheme()
    await flush()
    expect(html()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(icons()).toEqual([NAV_THEME_ICONS.dark, NAV_THEME_ICONS.dark])
  })

  it('setTheme ignoriert unbekannte Werte', async () => {
    store = useThemeStore()
    store.setTheme('dark')
    await flush()
    expect(store.theme).toBe('dark')
    store.setTheme('sepia' as never)
    await flush()
    expect(store.theme).toBe('dark')
  })

  it('übernimmt theme-changed der globalen Navigation', async () => {
    store = useThemeStore()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    await flush()
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('ignoriert theme-changed mit unbekanntem Wert', async () => {
    store = useThemeStore()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'sepia' } }))
    await flush()
    expect(store.theme).toBe('light')
  })

  it('übernimmt einen Nav-Klick, der data-theme direkt setzt, samt Klassen und Icon', async () => {
    store = useThemeStore()
    document.documentElement.setAttribute('data-theme', 'dark')
    await flush()
    expect(store.theme).toBe('dark')
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(icons()[1]).toBe(NAV_THEME_ICONS.dark)
  })

  it('setzt bei unbekannten Fremdwerten auf <html> den eigenen Zustand durch', async () => {
    store = useThemeStore()
    document.documentElement.setAttribute('data-theme', 'sepia')
    await flush()
    expect(html()).toBe('light')
  })

  it('reagiert nach cleanup nicht mehr auf Ereignisse', async () => {
    store = useThemeStore()
    store.cleanup()
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    document.documentElement.setAttribute('data-theme', 'dark')
    await flush()
    expect(store.theme).toBe('light')
  })

  it('arbeitet ohne localStorage weiter (Privatmodus)', () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('blocked')
    }
    try {
      store = useThemeStore()
      expect(store.theme).toBe('light')
    } finally {
      Storage.prototype.getItem = original
    }
  })
})

describe('isTheme / NAV_THEME_ICONS', () => {
  it('kennt nur light und dark', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('contrast-dark')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('nutzt Mond und Sonne als Icons', () => {
    expect(NAV_THEME_ICONS).toEqual({ light: '🌙', dark: '☀️' })
  })
})
