/**
 * workflowStore: Schritte upload → configure → converting → completed,
 * abgeleitet aus dem audioStore. axios und WasmAudioService sind gemockt.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import { useAudioStore } from '@/stores/audioStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { audioFile, flush, pendingUntilAborted, serverOk } from './storeTestUtils'

vi.mock('axios', () => ({
  default: { post: vi.fn(), isCancel: vi.fn() },
}))

vi.mock('@/services/WasmAudioService', () => ({
  shouldProcessLocally: vi.fn(() => false),
  convertLocally: vi.fn(),
  loadFFmpeg: vi.fn(),
  terminateFFmpeg: vi.fn(),
}))

const post = vi.mocked(axios.post)

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  post.mockReset()
  vi.mocked(axios.isCancel).mockReset().mockReturnValue(false)
})

describe('workflowStore', () => {
  it('durchläuft upload → configure → converting → completed', async () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()

    expect(workflow.currentStep).toBe('upload')
    expect(workflow.isUploadStep).toBe(true)
    expect(workflow.canStartConversion).toBe(false)

    audio.addFiles([audioFile()])
    expect(workflow.currentStep).toBe('configure')
    expect(workflow.canStartConversion).toBe(true)
    await flush()
    expect(workflow.lastTransition).toMatchObject({ from: 'upload', to: 'configure' })

    let finish: (value: ReturnType<typeof serverOk>) => void = () => {}
    post.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    const run = audio.convertAllFiles()
    expect(workflow.currentStep).toBe('converting')
    expect(workflow.isConvertingStep).toBe(true)
    expect(workflow.canStartConversion).toBe(false)
    await flush()
    expect(workflow.lastTransition).toMatchObject({ from: 'configure', to: 'converting' })

    finish(serverOk())
    await run
    expect(workflow.currentStep).toBe('completed')
    expect(workflow.isCompletedStep).toBe(true)
    expect(workflow.canDownload).toBe(true)
    await flush()
    expect(workflow.lastTransition).toMatchObject({ from: 'converting', to: 'completed' })
  })

  it('bleibt in configure, wenn alle Dateien fehlschlagen', async () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    post.mockRejectedValue(new Error('Network Error'))
    audio.addFiles([audioFile()])

    await audio.convertAllFiles()

    expect(workflow.currentStep).toBe('configure')
    expect(workflow.hasErrors).toBe(true)
    expect(workflow.canDownload).toBe(false)
    expect(workflow.canStartConversion).toBe(true)
  })

  it('ist completed, wenn mindestens eine Datei fertig ist und der Rest fehlschlug', async () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    post.mockResolvedValueOnce(serverOk()).mockRejectedValueOnce(new Error('Network Error'))
    audio.addFiles([audioFile('a.wav'), audioFile('b.wav')])

    await audio.convertAllFiles()

    expect(workflow.currentStep).toBe('completed')
    expect(workflow.fileSummary).toEqual({
      total: 2,
      pending: 0,
      converting: 0,
      completed: 1,
      error: 1,
    })
  })

  it('kehrt nach einem Abbruch zu configure zurück', async () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    post.mockImplementation((_url, _body, config) =>
      pendingUntilAborted((config as { signal?: AbortSignal }).signal)
    )
    audio.addFiles([audioFile()])

    const run = audio.convertAllFiles()
    await flush()
    expect(workflow.currentStep).toBe('converting')
    audio.cancelConversion()
    await run

    expect(workflow.currentStep).toBe('configure')
    expect(workflow.fileSummary.pending).toBe(1)
  })

  it('springt nach dem Leeren der Liste zurück zu upload', async () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    post.mockResolvedValue(serverOk())
    audio.addFiles([audioFile()])
    await audio.convertAllFiles()
    expect(workflow.currentStep).toBe('completed')

    audio.clearAllFiles()
    expect(workflow.currentStep).toBe('upload')
  })

  it('mittelt den Gesamtfortschritt über alle Dateien', () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    expect(workflow.overallProgress).toBe(0)

    const [a, b] = audio.addFiles([audioFile('a.wav'), audioFile('b.wav')])
    audio.updateFileProgress(a.id, 100)
    audio.updateFileProgress(b.id, 50)

    expect(workflow.overallProgress).toBe(75)
  })

  it('zählt lokale und Server-Dateien getrennt', () => {
    const audio = useAudioStore()
    const workflow = useWorkflowStore()
    audio.addFiles([audioFile('a.wav'), audioFile('b.wav')])

    expect(workflow.processingModeSummary).toMatchObject({ local: 0, server: 2 })
  })
})
