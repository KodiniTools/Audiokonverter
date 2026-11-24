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

const audioLayoutCss = stripComments(
  readFileSync(join(SRC, 'assets/styles/audio-layout.css'), 'utf8')
)

const audioHeaderCss = stripComments(
  readFileSync(join(SRC, 'assets/styles/audio-header.css'), 'utf8')
)

const audioControlsCss = stripComments(
  readFileSync(join(SRC, 'assets/styles/audio-controls.css'), 'utf8')
)

const audioWorkspaceCss = stripComments(
  readFileSync(join(SRC, 'assets/styles/audio-workspace.css'), 'utf8')
)

/** Alle zu prüfenden Stylesheets: main.css, audio-layout.css, audio-header.css und jede Komponente. */
const sheets = [
  { file: 'assets/styles/main.css', css: mainCssNoComments },
  { file: 'assets/styles/audio-layout.css', css: audioLayoutCss },
  { file: 'assets/styles/audio-header.css', css: audioHeaderCss },
  { file: 'assets/styles/audio-controls.css', css: audioControlsCss },
  { file: 'assets/styles/audio-workspace.css', css: audioWorkspaceCss },
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

  it('nutzen keine Verläufe, keine Unschärfe und kein color-mix (außer der Landing-Vorlage)', () => {
    const outsideLanding = sheets.filter(
      ({ file }) =>
        file !== 'assets/styles/audio-layout.css' &&
        file !== 'assets/styles/audio-header.css' &&
        file !== 'assets/styles/audio-controls.css' &&
        file !== 'assets/styles/audio-workspace.css'
    )
    const hits = outsideLanding.flatMap(({ file, css }) =>
      [...css.matchAll(/gradient\(|backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/g)].map(
        (m) => `${file}: ${m[0]}`
      )
    )
    expect(hits).toEqual([])
  })

  it('erlaubt in audio-layout.css nur die Verläufe der Audio-Normalizer-Landingpage', () => {
    const gradients = [
      ...audioLayoutCss.matchAll(
        /(?:radial|linear)-gradient\([^;]*?\)(?=,\s*(?:radial|linear)|;)/g
      ),
    ].map((m) => m[0].replace(/\s+/g, ' '))
    expect(gradients.length).toBe(4)
    expect([...new Set(gradients)].sort()).toEqual([
      'linear-gradient(150deg, var(--ds-surface-1), var(--ds-surface-0))',
      'radial-gradient(ellipse at 12% 0%, var(--ds-glow-blue), transparent 62%)',
      'radial-gradient(ellipse at 85% 0%, var(--ds-glow-cyan), transparent 68%)',
    ])
    expect(audioLayoutCss).not.toMatch(/backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/)
  })

  it('erlaubt in audio-header.css nur den Lichtschein über dem Werkzeug-Kopfbereich', () => {
    const gradients = [...audioHeaderCss.matchAll(/(?:radial|linear)-gradient\([^;]*?\);/g)].map(
      (m) => m[0].replace(/\s+/g, ' ')
    )
    expect(gradients).toEqual([
      'radial-gradient(ellipse at 50% 0%, var(--ds-glow-cyan), transparent 72%);',
    ])
    expect(audioHeaderCss).not.toMatch(/backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/)
  })

  it('erlaubt in audio-controls.css nur den Lichtschein der Dropzone und den Panel-Verlauf', () => {
    const flatControls = audioControlsCss.replace(/\s+/g, ' ')
    const gradients = [
      ...flatControls.matchAll(/(?:radial|linear)-gradient\((?:[^()]|\([^()]*\))*\)/g),
    ]
      .map((m) => m[0])
      .sort()
    expect(gradients).toEqual([
      'linear-gradient(145deg, var(--ds-surface-1), var(--ds-surface-0))',
      'radial-gradient(ellipse at 50% 0%, var(--ds-glow-cyan), transparent 75%)',
    ])
    expect(audioControlsCss).not.toMatch(/backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/)
  })

  it('markiert die Dropzone beim Ziehen sichtbar (Akzentfläche, durchgezogener Rahmen)', () => {
    expect(audioControlsCss.replace(/\s+/g, ' ')).toMatch(
      /\.drop-area\.drag-over \{ background: var\(--ds-accent-soft\); border-style: solid; border-color: var\(--ds-accent\);/
    )
  })

  it('erlaubt in audio-workspace.css nur die Flächenverläufe von Liste, Karten und Player', () => {
    const flatWorkspace = audioWorkspaceCss.replace(/\s+/g, ' ')
    const gradients = [
      ...flatWorkspace.matchAll(/(?:radial|linear)-gradient\((?:[^()]|\([^()]*\))*\)/g),
    ].map((m) => m[0])
    expect([...new Set(gradients)].sort()).toEqual([
      'linear-gradient(120deg, var(--ds-surface-1), var(--ds-surface-0))',
      'linear-gradient(145deg, var(--ds-surface-1), var(--ds-surface-0))',
    ])
    expect(gradients.length).toBe(3)
    expect(audioWorkspaceCss).not.toMatch(/backdrop-filter|filter:\s*blur|color-mix\(|text-shadow/)
  })

  it('zeigt den Lautstärkeregler des Players auch auf kleinen Bildschirmen', () => {
    expect(audioWorkspaceCss.replace(/\s+/g, ' ')).toMatch(
      /@media \(max-width: 768px\) \{.*\.sticky-player \.sp-volume \{ display: flex;/
    )
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
        (value) =>
          !/^var\(--ds-text-(?:xs|sm|md|lg|xl|2xl|3xl)\)$/.test(value) &&
          // Einzige Ausnahme: Hero-Titel 36–72 px wie im Audio Normalizer, aus --ds-text-2xl abgeleitet
          value !== 'clamp(calc(var(--ds-text-2xl) * 1.5), 5.25vw, calc(var(--ds-text-2xl) * 3))' &&
          // Titel der Werkzeugseite 32–56 px, aus --ds-text-3xl abgeleitet
          value !== 'clamp(var(--ds-text-3xl), 4.7vw, calc(var(--ds-text-3xl) * 1.75))'
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

describe('UI-Schrift: ausschließlich Supreme Regular', () => {
  const faces = mainCss.match(/@font-face\s*{[^}]*}/g) ?? []

  it('deklariert genau ein @font-face: Supreme 400 aus src/assets/fonts', () => {
    expect(faces).toHaveLength(1)
    expect(faces[0]).toMatch(/font-family:\s*'Supreme'/)
    expect(faces[0]).toMatch(/font-weight:\s*400\b/)
    expect(faces[0]).toContain("url('../fonts/Supreme-Regular.woff2')")
    expect(existsSync(join(SRC, 'assets/fonts/Supreme-Regular.woff2'))).toBe(true)
  })

  it('bündelt keine weiteren Schnitte', () => {
    expect(readdirSync(join(SRC, 'assets/fonts'))).toEqual(['Supreme-Regular.woff2'])
  })

  it('setzt in allen Stylesheets nur das Gewicht --ds-weight-regular', () => {
    expect(
      findAll(
        /font-weight:\s*([^;]+);/,
        (value) => value !== 'var(--ds-weight-regular)' && value !== '400'
      ) // 400 nur im @font-face
    ).toEqual([])
  })

  it('verhindert Kunst-Fettdruck und setzt b/strong/th auf Regular', () => {
    expect(mainCss).toMatch(/html \{[^}]*font-synthesis: none;/)
    expect(mainCss).toMatch(/b,\s*strong,\s*th \{\s*font-weight: var\(--ds-weight-regular\);/)
  })
})

describe('Buttons: dunkles Gold mit weißer Beschriftung', () => {
  const flatCss = mainCssNoComments.replace(/\s+/g, ' ')

  it('gibt allen .btn-Varianten und .btn-icon die Button-Fläche', () => {
    expect(flatCss).toMatch(
      /\.btn, \.btn-primary, \.btn-secondary, \.btn-ghost, \.btn-danger \{ background: var\(--ds-button-bg\); border-color: var\(--ds-button-bg\); color: var\(--ds-on-button\);/
    )
    expect(flatCss).toMatch(
      /\.btn-icon \{[^}]*background: var\(--ds-button-bg\);[^}]*color: var\(--ds-on-button\);/
    )
  })

  it('nutzt für Button-Flächen weder Akzent noch Eingabeflächen', () => {
    const buttonRules = sheets.flatMap(({ file, css }) =>
      [...css.matchAll(/([^{}]*(?:\.btn|-btn|__cta)[^{}]*)\{([^}]*)\}/g)]
        .filter((m) => /background(?:-color)?:\s*var\(--ds-(?:accent|surface)/.test(m[2] ?? ''))
        .map((m) => `${file}: ${(m[1] ?? '').trim()}`)
    )
    expect(buttonRules).toEqual([])
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

  it('färbt Theme-Umschalter und aktive Sprache wie alle Buttons', () => {
    expect(flat).toMatch(
      /\[data-lang\]\.global-nav-lang-btn\.active, [^{]*\.global-nav-theme-toggle \{\s*background-color: var\(--ds-button-bg\) !important;\s*color: var\(--ds-on-button\) !important;/
    )
  })

  it('lässt die inaktive Sprache ohne Goldfläche', () => {
    expect(flat).not.toMatch(/\[data-lang\]\.global-nav-lang-btn(?:,| \{)/)
    expect(flat).toMatch(
      /\.global-nav-lang-btn:not\(\.active\):hover \{\s*text-decoration: underline;/
    )
  })

  it('legt die globale Navigation über die Audio-Konverter-Navigation', () => {
    expect(audioHeaderCss).toMatch(/z-index: calc\(var\(--ds-z-topbar\) \+ 1\);/)
    expect(audioHeaderCss).toMatch(/\.anchor-nav \{[^}]*z-index: var\(--ds-z-topbar\);/)
  })

  it('hält den Cookie-Banner über Navigation und Dropdowns', () => {
    expect(flat).toMatch(
      /\.cookie-banner,[\s\S]*?z-index: 10000 !important;\s*position: fixed !important;/
    )
  })

  it('markiert die aktive Seite der Audio-Konverter-Navigation dunkelgold mit weißer Schrift', () => {
    const flatHeader = audioHeaderCss.replace(/\s+/g, ' ')
    expect(flatHeader).toMatch(
      /\.anchor-nav__link\[aria-current='page'\], \.anchor-nav__link\[aria-current='page'\]:hover \{ color: var\(--ds-on-button\); background: var\(--ds-button-bg\);/
    )
  })

  it('stellt die Navigation vor die Landingpage, damit sie auch auf /app sichtbar ist', () => {
    const navIndex = indexHtml.indexOf('<nav class="anchor-nav app-surface" id="anchor-nav"')
    expect(navIndex).toBeGreaterThan(0)
    expect(navIndex).toBeLessThan(indexHtml.indexOf('<main class="audio-landing'))
    expect(indexHtml).toMatch(/data-audio-overview/)
    expect(indexHtml).toMatch(/data-audio-app/)
  })

  it('nimmt die Landingpage und die Werkzeughülle von den Partial-Regeln aus', () => {
    expect(indexHtml).toMatch(/<main class="audio-landing app-surface" id="audio-landing">/)
    expect(indexHtml).toMatch(/<div class="audio-tool-shell app-surface" id="audio-tool-shell">/)
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
