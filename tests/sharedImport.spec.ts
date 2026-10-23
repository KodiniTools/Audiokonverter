import { describe, expect, it, vi } from 'vitest'
import { importSharedFiles } from '@/composables/useSharedImport'
import type { SharedFile } from '@/types'

const entry = (name: string, source: string): SharedFile => ({
  id: 1,
  name,
  blob: new Blob([new Uint8Array(8)], { type: 'audio/wav' }),
  mimeType: 'audio/wav',
  source,
  sharedAt: 1_700_000_000_000,
})

function deps(search: string, entries: SharedFile[]) {
  return {
    search,
    getSharedFiles: vi.fn(async () => entries),
    clearSharedFiles: vi.fn(async () => {}),
    addFiles: vi.fn(),
  }
}

describe('importSharedFiles', () => {
  it('übernimmt Dateien der genannten Quelle als File und leert den Speicher', async () => {
    const d = deps('?source=audio-cutter', [entry('clip_cut.wav', 'audio-cutter')])
    expect(await importSharedFiles(d)).toBe(1)
    const files = d.addFiles.mock.calls[0][0] as File[]
    expect(files).toHaveLength(1)
    expect(files[0]).toBeInstanceOf(File)
    expect(files[0].name).toBe('clip_cut.wav')
    expect(files[0].type).toBe('audio/wav')
    expect(d.clearSharedFiles).toHaveBeenCalledOnce()
  })

  it('ignoriert Einträge anderer Quellen', async () => {
    const d = deps('?source=audio-cutter', [entry('x.mp3', 'audiokonverter')])
    expect(await importSharedFiles(d)).toBe(0)
    expect(d.addFiles).not.toHaveBeenCalled()
    expect(d.clearSharedFiles).not.toHaveBeenCalled()
  })

  it('tut ohne source-Parameter oder bei eigener Quelle nichts', async () => {
    for (const search of ['', '?foo=1', '?source=audiokonverter']) {
      const d = deps(search, [entry('a.wav', 'audiokonverter')])
      expect(await importSharedFiles(d)).toBe(0)
      expect(d.getSharedFiles).not.toHaveBeenCalled()
    }
  })
})
