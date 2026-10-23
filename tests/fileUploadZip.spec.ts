/**
 * FileUpload: Ein gewähltes ZIP wird im Browser entpackt; die enthaltenen
 * Audiodateien landen zusammen mit normal gewählten Dateien in der Warteschlange.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, type App } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import JSZip from 'jszip'
import FileUpload from '@/components/FileUpload.vue'
import { i18n } from '@/locales'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

vi.mock('@/services/WasmAudioService', () => ({
  shouldProcessLocally: vi.fn(() => false),
  convertLocally: vi.fn(),
  loadFFmpeg: vi.fn(),
  terminateFFmpeg: vi.fn(),
}))

let app: App | null = null
let host: HTMLElement
let pinia: Pinia

function mountUpload(): void {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(FileUpload).use(pinia).use(i18n)
  app.mount(host)
}

/** Simuliert die Dateiauswahl im versteckten Eingabefeld. */
function selectFiles(files: File[]): void {
  const input = host.querySelector<HTMLInputElement>('input[type="file"]:not([webkitdirectory])')
  if (!input) throw new Error('Kein Datei-Eingabefeld')
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  input.dispatchEvent(new Event('change'))
}

async function zipFile(name: string, entries: Record<string, number[]>): Promise<File> {
  const zip = new JSZip()
  for (const [path, data] of Object.entries(entries)) zip.file(path, new Uint8Array(data))
  const content = await zip.generateAsync({ type: 'uint8array' })
  return new File([content], name, { type: 'application/zip' })
}

/** Wartet, bis die Store-Warteschlange `count` Dateien hat. */
async function waitForFiles(count: number): Promise<void> {
  const store = useAudioStore()
  await vi.waitFor(() => expect(store.audioFiles.length).toBe(count))
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  useToast().toasts.value = []
})

afterEach(() => {
  app?.unmount()
  host.remove()
  app = null
})

describe('FileUpload – ZIP', () => {
  it('nimmt die Audiodateien aus dem ZIP und normale Dateien in die Warteschlange', async () => {
    mountUpload()
    const archive = await zipFile('album.zip', {
      'Album/01.mp3': [1, 2],
      'Album/02.flac': [3],
      'Album/cover.jpg': [4],
      '__MACOSX/Album/._01.mp3': [5],
    })
    const single = new File([new Uint8Array([9])], 'single.wav', { type: 'audio/wav' })

    selectFiles([archive, single])
    await waitForFiles(3)

    const store = useAudioStore()
    expect(store.audioFiles.map((f) => f.name)).toEqual(['01.mp3', '02.flac', 'single.wav'])
    expect(store.audioFiles.every((f) => f.status === 'pending')).toBe(true)
    expect(store.audioFiles.map((f) => f.type)).toEqual(['audio/mpeg', 'audio/flac', 'audio/wav'])
    const info = useToast().toasts.value.find((t) => t.type === 'info')
    expect(info?.title).toBe('album.zip')
  })

  it('meldet ein ZIP ohne Audio als Fehler und fügt nichts hinzu', async () => {
    mountUpload()
    selectFiles([await zipFile('docs.zip', { 'readme.txt': [1] })])

    await vi.waitFor(() =>
      expect(useToast().toasts.value.some((t) => t.type === 'error')).toBe(true)
    )
    expect(useAudioStore().audioFiles).toEqual([])
    expect(useToast().toasts.value.find((t) => t.type === 'error')?.message).toContain('docs.zip')
  })

  it('meldet ein beschädigtes ZIP als Fehler', async () => {
    mountUpload()
    selectFiles([new File([new Uint8Array([1, 2, 3])], 'kaputt.zip', { type: 'application/zip' })])

    await vi.waitFor(() =>
      expect(useToast().toasts.value.some((t) => t.type === 'error')).toBe(true)
    )
    expect(useAudioStore().audioFiles).toEqual([])
  })
})
