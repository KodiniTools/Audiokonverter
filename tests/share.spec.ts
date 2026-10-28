/**
 * Teilen konvertierter Dateien: Web Share API mit canShare-Prüfung und
 * Download-Fallback, wenn der Browser die Dateien nicht teilen kann.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FileList from '@/components/FileList.vue'
import { i18n } from '@/locales'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import { saveBlobToDevice } from '@/utils/fileSaver'
import { isFileShareSupported, shareFiles, toShareFiles } from '@/utils/fileSharer'
import { audioFile, flush } from './storeTestUtils'

vi.mock('@/services/WasmAudioService', () => ({
  shouldProcessLocally: vi.fn(() => false),
  convertLocally: vi.fn(),
  loadFFmpeg: vi.fn(),
  terminateFFmpeg: vi.fn(),
}))

vi.mock('@/utils/fileSaver', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/fileSaver')>()
  return { ...original, saveBlobToDevice: vi.fn(async () => 'fallback' as const) }
})

const share = vi.fn<(data: ShareData) => Promise<void>>()
const canShare = vi.fn<(data: ShareData) => boolean>()

function installShareApi(): void {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true })
}

function removeShareApi(): void {
  // jsdom kennt beide nicht; entfernen stellt den Ausgangszustand her
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
}

function domError(name: string): DOMException {
  return new DOMException(name, name)
}

beforeEach(() => {
  share.mockReset().mockResolvedValue(undefined)
  canShare.mockReset().mockReturnValue(true)
  vi.mocked(saveBlobToDevice).mockClear()
})

afterEach(() => {
  removeShareApi()
})

describe('fileSharer', () => {
  it('erkennt fehlende Unterstützung und teilt dann nicht', async () => {
    expect(isFileShareSupported()).toBe(false)
    expect(await shareFiles([new File(['x'], 'a.mp3')])).toBe('unsupported')
  })

  it('setzt den Audio-MIME-Typ passend zur Endung', () => {
    const [file] = toShareFiles([{ name: 'song.mp3', blob: new Blob(['x']) }])
    expect(file.name).toBe('song.mp3')
    expect(file.type).toBe('audio/mpeg')
  })

  it('übergibt die Dateien an navigator.share', async () => {
    installShareApi()
    const files = [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })]
    expect(await shareFiles(files, 'Titel')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files, title: 'Titel' })
  })

  it('meldet unsupported, wenn canShare die Dateien ablehnt', async () => {
    installShareApi()
    canShare.mockReturnValue(false)
    expect(await shareFiles([new File(['x'], 'a.wma')])).toBe('unsupported')
    expect(share).not.toHaveBeenCalled()
  })

  it.each([
    ['AbortError', 'cancelled'],
    ['NotAllowedError', 'needsGesture'],
  ])('ordnet %s als %s ein', async (name, expected) => {
    installShareApi()
    share.mockRejectedValue(domError(name))
    expect(await shareFiles([new File(['x'], 'a.mp3')])).toBe(expected)
  })
})

describe('FileList – Teilen', () => {
  let app: App | null = null
  let host: HTMLElement
  let pinia: Pinia

  function mountFileList(): void {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(FileList).use(pinia).use(i18n)
    app.mount(host)
  }

  function shareButton(): HTMLButtonElement {
    const button = host.querySelector<HTMLButtonElement>('.btn-share')
    if (!button) throw new Error('Kein Teilen-Knopf')
    return button
  }

  function addCompleted(name = 'song.mp3'): void {
    const store = useAudioStore()
    store.addFiles([audioFile('song.wav')])
    Object.assign(store.audioFiles[store.audioFiles.length - 1], {
      status: 'completed',
      convertedUrl: 'blob:converted',
      convertedName: name,
      convertedSize: 3,
      convertedFormat: 'MP3',
    })
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(new Blob(['abc'], { type: 'audio/mpeg' }))
    )
  })

  afterEach(() => {
    app?.unmount()
    host.remove()
    app = null
    const { toasts } = useToast()
    toasts.value.splice(0)
  })

  it('zeigt keinen Teilen-Knopf, wenn der Browser nicht teilen kann', async () => {
    addCompleted()
    mountFileList()
    expect(host.querySelector('.btn-share')).toBeNull()
  })

  it('öffnet das Teilen-Menü mit der konvertierten Datei', async () => {
    installShareApi()
    addCompleted('song.mp3')
    mountFileList()

    shareButton().click()
    await flush()

    expect(share).toHaveBeenCalledOnce()
    const [file] = share.mock.calls[0][0].files ?? []
    expect(file.name).toBe('song.mp3')
    expect(file.type).toBe('audio/mpeg')
    expect(saveBlobToDevice).not.toHaveBeenCalled()
  })

  it('lädt die Datei herunter, wenn das Format nicht geteilt werden kann', async () => {
    installShareApi()
    canShare.mockReturnValue(false)
    addCompleted('song.wma')
    mountFileList()

    shareButton().click()
    await flush()

    expect(share).not.toHaveBeenCalled()
    expect(saveBlobToDevice).toHaveBeenCalledOnce()
    expect(vi.mocked(saveBlobToDevice).mock.calls[0][1]).toBe('song.wma')
  })

  it('bietet nach abgelaufener Klick-Berechtigung „Jetzt teilen“ an', async () => {
    installShareApi()
    share.mockRejectedValueOnce(domError('NotAllowedError'))
    addCompleted()
    mountFileList()

    shareButton().click()
    await flush()

    const { toasts } = useToast()
    const ready = toasts.value.find((toast) => toast.actions.length === 1)
    if (!ready) throw new Error('Kein „Jetzt teilen“-Toast')
    ready.actions[0].callback()
    await flush()

    expect(share).toHaveBeenCalledTimes(2)
    expect(toasts.value.some((toast) => toast.type === 'success')).toBe(true)
  })

  it('sperrt den Knopf, solange geteilt wird', async () => {
    installShareApi()
    let finish!: () => void
    share.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)))
    addCompleted()
    mountFileList()
    const button = shareButton()

    button.click()
    await flush()
    await nextTick()
    expect(button.disabled).toBe(true)

    finish()
    await flush()
    await nextTick()
    expect(button.disabled).toBe(false)
  })
})
