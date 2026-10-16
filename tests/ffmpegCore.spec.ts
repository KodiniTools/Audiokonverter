/**
 * Selbst gehosteter FFmpeg-Kern: Version und Dateien müssen zur installierten
 * @ffmpeg/core und zu @ffmpeg/ffmpeg passen, sonst lädt der Worker einen
 * inkompatiblen Kern.
 */
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FFMPEG_CORE_DIR, FFMPEG_CORE_FILES, FFMPEG_CORE_VERSION } from '@/config/ffmpegCore'

const require = createRequire(import.meta.url)
const coreDir = join(dirname(require.resolve('@ffmpeg/core')), '..', 'esm')
const root = join(__dirname, '..')

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

describe('FFmpeg-Kern (selbst gehostet)', () => {
  it('entspricht der installierten @ffmpeg/core', () => {
    const pkg = readJson(join(root, 'node_modules/@ffmpeg/core/package.json'))
    expect(pkg.version).toBe(FFMPEG_CORE_VERSION)
  })

  it('ist in package.json exakt auf diese Version festgelegt', () => {
    const pkg = readJson(join(root, 'package.json')) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@ffmpeg/core']).toBe(FFMPEG_CORE_VERSION)
  })

  it('passt zur Kern-Version, für die @ffmpeg/ffmpeg gebaut ist', () => {
    const constJs = readFileSync(
      join(root, 'node_modules/@ffmpeg/ffmpeg/dist/esm/const.js'),
      'utf8'
    )
    expect(constJs).toContain(`CORE_VERSION = "${FFMPEG_CORE_VERSION}"`)
  })

  it('findet beide Dateien im ESM-Build', () => {
    for (const name of FFMPEG_CORE_FILES) {
      expect(existsSync(join(coreDir, name))).toBe(true)
    }
  })

  it('trägt die Version im Pfad, damit der Service-Worker-Cache nach Updates nicht veraltet', () => {
    expect(FFMPEG_CORE_DIR).toBe(`ffmpeg/${FFMPEG_CORE_VERSION}`)
  })

  it('nutzt den ESM-Build mit Default-Export (Modul-Worker lädt per import())', () => {
    expect(readFileSync(join(coreDir, 'ffmpeg-core.js'), 'utf8')).toMatch(/export default/)
  })
})
