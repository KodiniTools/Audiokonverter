/** ZIP-Upload: Audiodateien im Browser entpacken, Rest überspringen, Grenzen einhalten. */
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { DEFAULT_ZIP_LIMITS, ZipExtractError, extractAudioFromZip } from '@/utils/unzipAudio'
import { audioMimeFromName, isAudioFile, isZipFile } from '@/utils/audioFiles'

/** jsdom-Blobs haben kein arrayBuffer(); FileReader gibt es dort. */
function readBlob(blob: Blob): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve([...new Uint8Array(reader.result as ArrayBuffer)])
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

async function makeZip(
  entries: Record<string, Uint8Array | null>,
  compression: 'STORE' | 'DEFLATE' = 'STORE'
): Promise<Blob> {
  const zip = new JSZip()
  for (const [name, data] of Object.entries(entries)) {
    if (data === null) zip.folder(name)
    else zip.file(name, data)
  }
  return new Blob([await zip.generateAsync({ type: 'uint8array', compression })])
}

const bytes = (...values: number[]) => new Uint8Array(values)

async function expectZipError(promise: Promise<unknown>, code: string): Promise<void> {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ZipExtractError)
  expect((error as ZipExtractError).code).toBe(code)
}

describe('extractAudioFromZip', () => {
  it('entpackt Audiodateien mit Inhalt, Namen ohne Pfad und passendem MIME-Typ', async () => {
    const archive = await makeZip({
      'a.mp3': bytes(1, 2, 3),
      'Album/CD 1/b.FLAC': bytes(4, 5),
      'Album/': null,
    })

    const result = await extractAudioFromZip(archive)

    expect(result.files.map((f) => f.name)).toEqual(['a.mp3', 'b.FLAC'])
    expect(result.files.map((f) => f.type)).toEqual(['audio/mpeg', 'audio/flac'])
    expect(await readBlob(result.files[0])).toEqual([1, 2, 3])
    expect(await readBlob(result.files[1])).toEqual([4, 5])
    expect(result.skipped).toEqual([])
    expect(result.limitReached).toBe(false)
  })

  it('entpackt auch komprimierte (DEFLATE) Einträge', async () => {
    const data = new Uint8Array(50_000).fill(9)
    const result = await extractAudioFromZip(await makeZip({ 'x.wav': data }, 'DEFLATE'))
    expect(result.files[0].size).toBe(50_000)
  })

  it('überspringt Nicht-Audio, macOS-Metadaten, versteckte Ordner und verschachtelte ZIPs', async () => {
    const archive = await makeZip({
      'song.ogg': bytes(1),
      'cover.jpg': bytes(2),
      '__MACOSX/._song.ogg': bytes(3),
      '._other.mp3': bytes(4),
      '.hidden/secret.mp3': bytes(5),
      '.DS_Store': bytes(6),
      'inner.zip': bytes(7),
    })

    const result = await extractAudioFromZip(archive)

    expect(result.files.map((f) => f.name)).toEqual(['song.ogg'])
    expect(result.skipped.sort()).toEqual(
      [
        'cover.jpg',
        '__MACOSX/._song.ogg',
        '._other.mp3',
        '.hidden/secret.mp3',
        '.DS_Store',
        'inner.zip',
      ].sort()
    )
  })

  it('weist Einträge über der Einzelgrenze ab, ohne sie ganz zu lesen', async () => {
    const archive = await makeZip({ 'big.mp3': new Uint8Array(2_000), 'ok.mp3': bytes(1) })

    const result = await extractAudioFromZip(archive, { ...DEFAULT_ZIP_LIMITS, maxFileSize: 1_000 })

    expect(result.files.map((f) => f.name)).toEqual(['ok.mp3'])
    expect(result.tooLarge).toEqual(['big.mp3'])
    expect(result.limitReached).toBe(false)
  })

  it('hört bei Erreichen der Gesamtgrenze auf (ZIP-Bombe)', async () => {
    // Stark komprimierbar: wenige Bytes im Archiv, viel entpackt
    const archive = await makeZip(
      {
        '1.wav': new Uint8Array(600),
        '2.wav': new Uint8Array(600),
        '3.wav': new Uint8Array(600),
      },
      'DEFLATE'
    )

    const result = await extractAudioFromZip(archive, {
      ...DEFAULT_ZIP_LIMITS,
      maxFileSize: 1_000,
      maxTotalSize: 1_000,
    })

    expect(result.files.map((f) => f.name)).toEqual(['1.wav'])
    expect(result.limitReached).toBe(true)
    expect(result.tooLarge).toEqual([])
  })

  it('lehnt zu große Archive ab, bevor sie gelesen werden', async () => {
    const archive = await makeZip({ 'a.mp3': new Uint8Array(100) })
    await expectZipError(
      extractAudioFromZip(archive, { ...DEFAULT_ZIP_LIMITS, maxArchiveSize: 10 }),
      'archive_too_large'
    )
  })

  it('lehnt Archive mit zu vielen Einträgen ab', async () => {
    const archive = await makeZip({ 'a.mp3': bytes(1), 'b.mp3': bytes(2), 'c.mp3': bytes(3) })
    await expectZipError(
      extractAudioFromZip(archive, { ...DEFAULT_ZIP_LIMITS, maxEntries: 2 }),
      'too_many_entries'
    )
  })

  it('meldet beschädigte oder fremde Dateien als ungültiges ZIP', async () => {
    await expectZipError(extractAudioFromZip(new Blob([bytes(1, 2, 3, 4)])), 'invalid_zip')
  })

  it('liefert für ein leeres Archiv keine Dateien', async () => {
    const result = await extractAudioFromZip(await makeZip({}))
    expect(result.files).toEqual([])
    expect(result.skipped).toEqual([])
  })
})

describe('audioFiles', () => {
  it('erkennt Audio an MIME-Typ oder Endung', () => {
    expect(isAudioFile({ name: 'x', type: 'audio/mpeg' })).toBe(true)
    expect(isAudioFile({ name: 'x.M4A', type: '' })).toBe(true)
    expect(isAudioFile({ name: 'x.zip', type: 'application/zip' })).toBe(false)
    expect(isAudioFile({ name: 'x.txt', type: 'text/plain' })).toBe(false)
  })

  it('erkennt ZIP an MIME-Typ oder Endung', () => {
    expect(isZipFile({ name: 'a.ZIP', type: '' })).toBe(true)
    expect(isZipFile({ name: 'a', type: 'application/x-zip-compressed' })).toBe(true)
    expect(isZipFile({ name: 'a.mp3', type: 'audio/mpeg' })).toBe(false)
  })

  it('leitet den MIME-Typ aus der Endung ab', () => {
    expect(audioMimeFromName('a.aif')).toBe('audio/aiff')
    expect(audioMimeFromName('a.weba')).toBe('audio/webm')
    expect(audioMimeFromName('a.xyz')).toBe('')
    expect(audioMimeFromName('noext')).toBe('')
  })
})
