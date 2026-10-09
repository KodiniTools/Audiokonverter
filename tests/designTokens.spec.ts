/**
 * Regressionsschutz für die Oberfläche auf den KodiniTools-Tokens v2.
 *
 * Nach dem Vorbild von KodiniTools/Collage-Maker (src/tests/designTokens.spec.ts) und
 * KodiniTools/MP3-Konverter (tests/designTokens.spec.js), angepasst an den Audio Konverter
 * (globale main.css plus Scoped-Styles in den Vue-Komponenten, kein Tailwind): verhindert die
 * Rückkehr der alten Navy/Gold-Variablen, fester Farbwerte, von Verläufen, Unschärfe und
 * Karten-Schatten; prüft, dass jede referenzierte Variable existiert, Supreme in allen genutzten
 * Gewichten gebündelt wird und die Partial-Angleichung des Collage Makers vorhanden ist.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseBlock } from './design-system/tokenTestUtils'

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '')

const mainCss = readFileSync(join(SRC, 'assets/styles/main.css'), 'utf8')
const mainCssNoComments = stripComments(mainCss)
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8')
const tokensCss = readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8')
const rootBlock = parseBlock(tokensCss, ':root', 'tokens-v2.css')

function collectFiles(dir: string, ext: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectFiles(full, ext, out)
    else if (entry.endsWith(ext)) out.push(full)
  }
  return out
}

const vueFiles = collectFiles(SRC, '.vue')

/** Alle <style>-Blöcke der Vue-Komponenten, je Datei. */
const vueStyles = vueFiles.map((file) => {
  const source = readFileSync(file, 'utf8')
  const css = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1] ?? '')
    .join('\n')
  return { file: relative(SRC, file), source, css: stripComments(css) }
})

/** Alle zu prüfenden Stylesheets: main.css und jede Komponente. */
const sheets = [
  { file: 'assets/styles/main.css', css: mainCssNoComments },
  ...vueStyles.map(({ file, css }) => ({ file, css })),
]

/** Treffer als „Datei: Wert“, damit ein Fehlschlag die Stelle nennt. */
function findAll(pattern: RegExp, filter: (value: string) => boolean = () => true): string[] {
  return sheets.flatMap(({ file, css }) =>
    [...css.matchAll(new RegExp(pattern.source, 'g'))]
      .map((m) => (m[1] ?? m[0]).trim())
      .filter(filter)
      .map((value) => `${file}: ${value}`)
  )
}

const LEGACY_VARIABLES =
  /var\(--(?:background|card-background|text-color|text-secondary|primary-color|primary-hover|secondary-color|accent-color|success-color|error-color|warning-color|accent-gradient|glass-[a-z]+|transition-speed)\b/

/** Variablen, die nicht aus den Tokens kommen, aber bewusst erlaubt sind. */
const EXTERNAL_VARIABLES = new Set([
  '--nav-height', // setzt die globale SSI-Navigation; Fallback 60px
  '--toast-status', // lokale Statusfarbe des Toasts, aus --ds-* gesetzt
])

describe('Stylesheets auf Tokens v2', () => {
  it('nutzen keine Variablen der alten Palette mehr', () => {
    expect(findAll(LEGACY_VARIABLES)).toEqual([])
  })

  it('enthalten keine festen Farbwerte (Hex, rgb(), hsl())', () => {
    expect(findAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/)).toEqual([])
  })

  it('referenzieren nur Variablen, die tokens-v2.css definiert', () => {
    const referenced = findAll(/var\((--[\w-]+)/, (name) => !EXTERNAL_VARIABLES.has(name))
    expect(referenced.length).toBeGreaterThan(100)
    expect(referenced.filter((hit) => rootBlock[hit.split(': ')[1] ?? ''] === undefined)).toEqual(
      []
    )
  })

  it('definieren keine eigenen Variablen außer der lokalen Toast-Statusfarbe', () => {
    expect(findAll(/(--[\w-]+)\s*:/, (name) => !EXTERNAL_VARIABLES.has(name))).toEqual([])
  })

  it('nutzen keine Verläufe, keine Unschärfe und kein color-mix', () => {
    expect(findAll(/gradient\(|backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/)).toEqual([])
  })

  it('setzen Schatten nur als Overlay-Schatten oder Fokus-Ring', () => {
    const allowed = ['var(--ds-focus-ring)', 'var(--ds-shadow-overlay)', 'none']
    expect(findAll(/box-shadow:\s*([^;]+);/, (value) => !allowed.includes(value))).toEqual([])
  })

  it('heben oder skalieren bei Hover nichts (Hover ändert nur Farbe)', () => {
    const hits = sheets.flatMap(({ file, css }) =>
      [...css.matchAll(/:hover[^{]*\{([^}]*)\}/g)]
        .filter((m) => /transform|translate|scale|filter/.test(m[1] ?? ''))
        .map((m) => `${file}: ${m[0].split('{')[0]?.trim()}`)
    )
    expect(hits).toEqual([])
  })

  it('nutzen nur die Token-Radien (oder 50 % für Punkte und Slider-Daumen)', () => {
    const tokenRadius = /^var\(--ds-radius-(sm|md|lg|full)\)$/
    expect(
      findAll(/border-radius:\s*([^;]+);/, (value) => !tokenRadius.test(value) && value !== '50%')
    ).toEqual([])
  })

  it('bleiben in der Schriftskala (nur --ds-text-*, keine Pixel- oder rem-Werte)', () => {
    expect(
      findAll(
        /font-size:\s*([^;]+);/,
        (value) => !/^var\(--ds-text-(?:xs|sm|md|lg|xl|2xl|3xl)\)$/.test(value)
      )
    ).toEqual([])
  })

  it('animieren Übergänge nur in den Token-Dauern', () => {
    const transitions = findAll(/transition:\s*([^;]+);/)
    expect(transitions.length).toBeGreaterThan(5)
    expect(
      transitions.filter((hit) =>
        (hit.split(': ')[1] ?? '')
          .split(',')
          .some((part) => !/var\(--ds-duration(?:-slow)?\) var\(--ds-ease\)/.test(part))
      )
    ).toEqual([])
  })

  it('setzen die Grundgröße des Body wie Collage Maker und Playlist Generator auf --ds-text-lg', () => {
    expect(mainCss).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/)
    expect(mainCss).toMatch(/body \{[^}]*font-family: var\(--ds-font-sans\)/)
  })

  it('setzen color-scheme für beide Themes', () => {
    expect(mainCss).toMatch(/:root\[data-theme='dark'\] \{\s*color-scheme: dark;/)
    expect(mainCss).toMatch(/:root\[data-theme='light'\] \{\s*color-scheme: light;/)
  })
})

describe('UI-Schrift Supreme (gebündelt wie im Collage Maker)', () => {
  it.each([
    [400, 'Regular'],
    [500, 'Medium'],
    [700, 'Bold'],
  ])('deklariert @font-face für Gewicht %i aus src/assets/fonts', (weight, cut) => {
    const faces = mainCss.match(/@font-face\s*{[^}]*}/g) ?? []
    const face = faces.find(
      (f) =>
        /font-family:\s*'Supreme'/.test(f) && new RegExp(`font-weight:\\s*${weight}\\b`).test(f)
    )
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined()
    expect(face).toContain(`url('../fonts/Supreme-${cut}.woff2')`)
    expect(existsSync(join(SRC, `assets/fonts/Supreme-${cut}.woff2`))).toBe(true)
  })
})

describe('Partial-Angleichung aus dem Collage Maker', () => {
  const PREFIX = 'body > :not(#app):not(script):not(.app-surface)'
  // Prettier bricht lange Selektoren um; für die Prüfung auf eine Zeile normalisieren
  const flat = mainCssNoComments.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')

  it('macht Nav und Footer transparent, nimmt Cookie-Banner und eigene Sektionen aus', () => {
    expect(flat).toContain(
      `${PREFIX}:not(.cookie-banner):not(.cookie-consent):not([class*='cookie']) { background-color: transparent !important;`
    )
  })

  it('gibt Dropdowns und dem geöffneten mobilen Menü eine feste Fläche', () => {
    expect(flat).toMatch(
      /\[class\*='drop'\],[\s\S]*?background-color: var\(--ds-surface-1\) !important;/
    )
    expect(flat).toMatch(
      /\.global-nav-links\.is-open \{\s*background-color: var\(--ds-surface-1\) !important;/
    )
  })

  it('färbt Texte, Links und Link-Hover der Partials aus den Tokens', () => {
    expect(flat).toMatch(/color: var\(--ds-text\) !important;/)
    expect(flat).toMatch(/color: var\(--ds-link\) !important;/)
    expect(flat).toMatch(/a:hover[^{]*\{\s*color: var\(--ds-accent\) !important;/)
  })

  it('nimmt Cookie-Elemente von den span/svg-Regeln aus (Schalter bleiben unterscheidbar)', () => {
    expect(flat).toContain(`${PREFIX}:not([class*='cookie']) span:empty {`)
    expect(flat).not.toMatch(
      /body > :not\(#app\):not\(script\)(?::not\(\.app-surface\))? span:empty \{/
    )
  })

  it('zeigt die aktive Sprache als Primärfläche', () => {
    expect(flat).toMatch(
      /\.global-nav-lang-btn\.active \{\s*background-color: var\(--ds-accent\) !important;\s*color: var\(--ds-on-accent\) !important;/
    )
  })

  it('hält den Cookie-Banner über Navigation und Dropdowns', () => {
    expect(flat).toMatch(
      /\.cookie-banner,[\s\S]*?z-index: 10000 !important;\s*position: fixed !important;/
    )
  })

  it('markiert alle eigenen Blöcke außerhalb von #app als .app-surface', () => {
    const ownBlocks = indexHtml.match(/<(?:nav|section) class="[^"]*"/g) ?? []
    expect(ownBlocks.length).toBe(4)
    expect(ownBlocks.filter((tag) => !tag.includes('app-surface'))).toEqual([])
  })
})

describe('index.html', () => {
  it('setzt data-theme vor dem ersten Paint (Standard hell)', () => {
    const head = indexHtml.slice(0, indexHtml.indexOf('</head>'))
    expect(head).toMatch(/localStorage\.getItem\('theme'\)/)
    expect(head).toMatch(/setAttribute\('data-theme', storedTheme === 'dark' \? 'dark' : 'light'\)/)
  })

  it('hat keine eigenen <style>-Blöcke mehr (Landing-Styles liegen in main.css)', () => {
    expect(indexHtml).not.toMatch(/<style[\s>]/)
  })

  it('nutzt keine Emoji als Icons', () => {
    expect(indexHtml.match(/&#(?:9654|10024|10067|128221);/g) ?? []).toEqual([])
    expect(indexHtml.match(/\p{Extended_Pictographic}/gu) ?? []).toEqual([])
  })
})

describe('Vue-Komponenten', () => {
  it('haben keine Inline-Farben', () => {
    const hits = vueStyles.filter(({ source }) =>
      /style="[^"]*(?:#[0-9a-fA-F]{3,8}|rgb|color)/.test(source)
    )
    expect(hits.map(({ file }) => file)).toEqual([])
  })

  it('setzen data-theme nicht selbst (nur der Theme-Store auf <html>)', () => {
    expect(
      vueStyles
        .filter(({ source }) => /:data-theme=|setAttribute\('data-theme'/.test(source))
        .map(({ file }) => file)
    ).toEqual([])
  })

  it('nutzen keine Unicode-Zeichen als Icons (×, ↓, ↻, ✓)', () => {
    const hits = vueStyles.filter(({ source }) => /&times;|&#8595;|&#8635;|&#10003;/.test(source))
    expect(hits.map(({ file }) => file)).toEqual([])
  })
})
