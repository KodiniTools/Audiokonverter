import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '@/types'

/**
 * Theme-Store.
 *
 * Mechanik wie im Collage Maker (src/stores/settings.ts) und im MP3 Konverter:
 * - `html[data-theme="light" | "dark"]` schaltet die Design-Tokens (src/design-system/tokens-v2.css)
 *   und die globalen SSI-Partials. Ein Inline-Skript in index.html setzt das Attribut schon vor dem
 *   ersten Paint, der Store übernimmt danach.
 * - `html.dark` bleibt für externe Skripte erhalten, `body.light-theme` hält Parität zum
 *   Playlist Generator.
 * - Das Icon des Theme-Umschalters der globalen Navigation zeigt das Ziel des nächsten Klicks
 *   (Mond im hellen, Sonne im dunklen Schema).
 * - `localStorage.theme` teilen sich alle KodiniTools-Seiten; er enthält nur `light` oder `dark`.
 */

export const THEMES: readonly Theme[] = ['light', 'dark']

/** Icons des Theme-Umschalters der globalen Navigation. */
export const NAV_THEME_ICONS: Readonly<Record<Theme, string>> = Object.freeze({
  light: '🌙',
  dark: '☀️',
})

const STORAGE_KEY = 'theme'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Speicher gesperrt (z. B. Privatmodus): Theme gilt dann nur für diese Sitzung
  }
}

/** Setzt Attribut, Klassen und Nav-Icon für ein Theme. */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (root.getAttribute('data-theme') !== theme) {
    root.setAttribute('data-theme', theme)
  }
  root.classList.toggle('dark', theme === 'dark')
  document.body?.classList.toggle('light-theme', theme === 'light')
  document.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
    icon.textContent = NAV_THEME_ICONS[theme]
  })
}

export const useThemeStore = defineStore('theme', () => {
  const stored = readStorage(STORAGE_KEY)
  const theme = ref<Theme>(isTheme(stored) ? stored : 'light')

  watch(
    theme,
    (value) => {
      applyThemeToDocument(value)
      writeStorage(STORAGE_KEY, value)
    },
    { immediate: true }
  )

  // Event der globalen Navigation (theme-changed, detail.theme = 'light' | 'dark')
  function handleThemeChanged(event: Event): void {
    const value = (event as CustomEvent<{ theme?: unknown }>).detail?.theme
    if (isTheme(value) && value !== theme.value) {
      theme.value = value
    }
  }

  // Fallback für Nav-Versionen ohne Event: Attribut auf <html> beobachten. Unbekannte Fremdwerte
  // werden durch den eigenen Zustand ersetzt.
  let observer: MutationObserver | null = null
  if (typeof window !== 'undefined') {
    window.addEventListener('theme-changed', handleThemeChanged)
    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => {
        const value = document.documentElement.getAttribute('data-theme')
        if (value === theme.value) return
        if (isTheme(value)) {
          theme.value = value
        } else {
          applyThemeToDocument(theme.value)
        }
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    }
  }

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(value: Theme): void {
    if (isTheme(value)) theme.value = value
  }

  function cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('theme-changed', handleThemeChanged)
    }
    observer?.disconnect()
    observer = null
  }

  return { theme, toggleTheme, setTheme, cleanup }
})
