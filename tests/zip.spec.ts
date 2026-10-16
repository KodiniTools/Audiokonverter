/** ZIP-Export: stückweiser Aufbau und eindeutige Dateinamen. */
import { describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import { buildZipBlob, uniqueZipNames } from '@/utils/zip'

/** jsdom-Blobs haben kein arrayBuffer(); FileReader gibt es dort. */
function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

describe('uniqueZipNames', () => {
  it('lässt eindeutige Namen unverändert', () => {
    expect(uniqueZipNames(['a.mp3', 'b.mp3'])).toEqual(['a.mp3', 'b.mp3'])
  })

  it('nummeriert doppelte Namen durch, auch ohne Endung und unabhängig von Groß/klein', () => {
    expect(
      uniqueZipNames(['song.mp3', 'song.mp3', 'Song.MP3', 'song (2).mp3', 'readme', 'readme'])
    ).toEqual([
      'song.mp3',
      'song (2).mp3',
      'Song (3).MP3',
      'song (2) (2).mp3',
      'readme',
      'readme (2)',
    ])
  })
})

/** Inhalt eines Eintrags; bricht ab, wenn er fehlt. */
async function entry(zip: JSZip, name: string): Promise<Uint8Array> {
  const file = zip.file(name)
  if (!file) throw new Error(`${name} fehlt im ZIP`)
  return file.async('uint8array')
}

describe('buildZipBlob', () => {
  it('erzeugt ein lesbares ZIP mit allen Dateien', async () => {
    const zipBlob = await buildZipBlob([
      { name: 'a.mp3', data: new Blob([new Uint8Array([1, 2, 3])]) },
      { name: 'a.mp3', data: new Blob([new Uint8Array([4, 5])]) },
      { name: 'b.ogg', data: new Blob([new Uint8Array(70_000).fill(7)]) },
    ])

    expect(zipBlob.type).toBe('application/zip')
    const zip = await JSZip.loadAsync(await readBlob(zipBlob))
    expect(Object.keys(zip.files).sort()).toEqual(['a (2).mp3', 'a.mp3', 'b.ogg'])
    expect([...(await entry(zip, 'a.mp3'))]).toEqual([1, 2, 3])
    expect([...(await entry(zip, 'a (2).mp3'))]).toEqual([4, 5])
    const big = await entry(zip, 'b.ogg')
    expect(big.length).toBe(70_000)
    expect(big.every((v) => v === 7)).toBe(true)
  })

  it('legt das Archiv nicht in einem einzigen Puffer an', async () => {
    const generateAsync = vi.spyOn(JSZip.prototype, 'generateAsync')
    await buildZipBlob([{ name: 'a.mp3', data: new Blob([new Uint8Array(10)]) }])
    expect(generateAsync).not.toHaveBeenCalled()
    generateAsync.mockRestore()
  })

  it('liefert für eine leere Liste ein leeres, gültiges ZIP', async () => {
    const zip = await JSZip.loadAsync(await readBlob(await buildZipBlob([])))
    expect(Object.keys(zip.files)).toEqual([])
  })
})
