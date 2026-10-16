/**
 * FileList: Der Wiederholen-Knopf ruft nur audioStore.retryFile auf und ist
 * gesperrt, solange eine Konvertierung läuft.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FileList from '@/components/FileList.vue'
import { i18n } from '@/locales'
import { useAudioStore } from '@/stores/audioStore'
import { audioFile } from './storeTestUtils'

vi.mock('@/services/WasmAudioService', () => ({
  shouldProcessLocally: vi.fn(() => false),
  convertLocally: vi.fn(),
  loadFFmpeg: vi.fn(),
  terminateFFmpeg: vi.fn(),
}))

let app: App | null = null
let host: HTMLElement
let pinia: Pinia

function mountFileList(): void {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(FileList).use(pinia).use(i18n)
  app.mount(host)
}

function retryButton(): HTMLButtonElement {
  const button = host.querySelector<HTMLButtonElement>('.btn-retry')
  if (!button) throw new Error('Kein Wiederholen-Knopf')
  return button
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

afterEach(() => {
  app?.unmount()
  host.remove()
  app = null
})

describe('FileList – Wiederholen', () => {
  it('ruft retryFile mit der ID der fehlgeschlagenen Datei auf', async () => {
    const store = useAudioStore()
    const [file] = store.addFiles([audioFile('song.wav')])
    store.audioFiles[0].status = 'error'
    const retry = vi.spyOn(store, 'retryFile').mockResolvedValue({
      started: true,
      cancelled: false,
    })
    mountFileList()

    retryButton().click()

    expect(retry).toHaveBeenCalledWith(file.id)
  })

  it('sperrt den Knopf, solange eine Konvertierung läuft', async () => {
    const store = useAudioStore()
    store.addFiles([audioFile('song.wav')])
    store.audioFiles[0].status = 'error'
    mountFileList()
    expect(retryButton().disabled).toBe(false)

    store.isConverting = true
    await nextTick()
    expect(retryButton().disabled).toBe(true)
  })
})
