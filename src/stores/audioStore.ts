import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import {
  shouldProcessLocally,
  convertLocally,
  loadFFmpeg,
  terminateFFmpeg,
} from '@/services/WasmAudioService'
import { runPool } from '@/utils/runPool'
import {
  API_BASE,
  cancelServerJob,
  followServerJob,
  isServerJob,
  type ServerConvertResult,
  type ServerJobCreated,
} from '@/services/serverJob'
import type { AudioFile, AudioFormat, ConversionResult, SavedSettings } from '@/types'

const STORAGE_KEY = 'audiokonverter_settings'

// Höchstens so viele Server-Konvertierungen gleichzeitig. Das Backend begrenzt
// zusätzlich die ffmpeg-Prozesse (FFMPEG_MAX_CONCURRENT in backend/server.js).
// Lokal (FFmpeg.wasm) läuft immer nur eine Datei: es gibt eine FFmpeg-Instanz
// und einen Fortschritts-Handler.
export const SERVER_CONCURRENCY = 3

/** Anteil des Uploads am Fortschritt einer Server-Konvertierung (in %); der Rest ist die Verarbeitung. */
export const UPLOAD_SHARE = 50

function loadSavedSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedSettings) : {}
  } catch {
    return {}
  }
}

const saved = loadSavedSettings()

export const useAudioStore = defineStore('audio', () => {
  // State
  const audioFiles = ref<AudioFile[]>([])
  const convertedFiles = ref<AudioFile[]>([])
  const isConverting = ref(false)
  // True, sobald der Nutzer auf Abbrechen geklickt hat (bis der Lauf endet)
  const isCancelling = ref(false)
  const currentFormat = ref<AudioFormat>((saved.format as AudioFormat) ?? 'mp3')
  const currentQuality = ref<number>(saved.quality ?? 7)
  const conversionProgress = ref<Record<string, number>>({})
  const wasmReady = ref(false)
  const wasmLoading = ref(false)

  // Steuert den Abbruch des laufenden Konvertierungslaufs (Server + WASM)
  let abortController: AbortController | null = null

  // Computed
  const hasFiles = computed(() => audioFiles.value.length > 0)
  const hasConvertedFiles = computed(() => convertedFiles.value.length > 0)
  const fileCount = computed(() => audioFiles.value.length)
  const totalSize = computed(() => audioFiles.value.reduce((sum, f) => sum + f.size, 0))

  function getConvertedFileName(originalName: string, newFormat: AudioFormat): string {
    const lastDotIndex = originalName.lastIndexOf('.')
    const baseName = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
    return `${baseName}.${newFormat}`
  }

  function addFiles(files: FileList | File[]): AudioFile[] {
    const newFiles: AudioFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      convertedUrl: null,
      convertedName: null,
      convertedSize: null,
      convertedFormat: null,
      processedLocally: shouldProcessLocally(file),
      error: null,
    }))

    audioFiles.value.push(...newFiles)

    if (newFiles.some((f) => f.processedLocally) && !wasmReady.value && !wasmLoading.value) {
      preloadWasm()
    }

    return newFiles
  }

  async function preloadWasm(): Promise<void> {
    wasmLoading.value = true
    try {
      await loadFFmpeg()
      wasmReady.value = true
    } catch (err) {
      console.warn('FFmpeg.wasm konnte nicht geladen werden, Fallback auf Server:', err)
    } finally {
      wasmLoading.value = false
    }
  }

  // Lokal (FFmpeg.wasm) erzeugte Ergebnisse liegen als Blob-URL im Speicher und
  // müssen freigegeben werden. Server-Ergebnisse sind normale Pfade.
  // Aufrufer stoppen vorher den Player, falls er die URL gerade abspielt.
  function revokeConvertedUrl(file: AudioFile): void {
    if (file.convertedUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(file.convertedUrl)
      file.convertedUrl = null
    }
  }

  function removeFile(fileId: string): void {
    const index = audioFiles.value.findIndex((f) => f.id === fileId)
    if (index === -1) return
    revokeConvertedUrl(audioFiles.value[index])
    audioFiles.value.splice(index, 1)
    convertedFiles.value = convertedFiles.value.filter((f) => f.id !== fileId)
  }

  function clearAllFiles(): void {
    audioFiles.value.forEach(revokeConvertedUrl)
    audioFiles.value = []
    convertedFiles.value = []
    conversionProgress.value = {}
    isConverting.value = false
  }

  function updateFileProgress(
    fileId: string,
    progress: number,
    status?: AudioFile['status']
  ): void {
    const file = audioFiles.value.find((f) => f.id === fileId)
    if (file) {
      file.progress = progress
      if (status) file.status = status
    }
    conversionProgress.value[fileId] = progress
  }

  async function convertFileLocally(
    fileData: AudioFile,
    signal?: AbortSignal
  ): Promise<ConversionResult> {
    updateFileProgress(fileData.id, 0, 'converting')

    try {
      const blob = await convertLocally(
        fileData.file,
        currentFormat.value,
        currentQuality.value,
        (progress) => updateFileProgress(fileData.id, Math.min(progress, 99))
      )

      updateFileProgress(fileData.id, 100, 'completed')
      const file = audioFiles.value.find((f) => f.id === fileData.id)

      if (file) {
        file.convertedUrl = URL.createObjectURL(blob)
        file.convertedName = getConvertedFileName(fileData.name, currentFormat.value)
        file.convertedFormat = currentFormat.value.toUpperCase()
        file.convertedSize = blob.size
        file.status = 'completed'
        file.processedLocally = true
        convertedFiles.value.push(file)
      }

      return { success: true }
    } catch (error) {
      // Abbruch durch den Nutzer: nicht auf den Server ausweichen, sondern die
      // Datei sauber zurücksetzen (die hochgeladene Datei bleibt erhalten).
      if (signal?.aborted) {
        resetCancelledFile(fileData.id)
        return { success: false, error: 'cancelled' }
      }
      console.warn('Lokale Konvertierung fehlgeschlagen, Fallback auf Server:', error)
      return convertFileRemotely(fileData, signal)
    }
  }

  async function convertFileRemotely(
    fileData: AudioFile,
    signal?: AbortSignal
  ): Promise<ConversionResult> {
    const formData = new FormData()
    formData.append('file', fileData.file)
    formData.append('format', currentFormat.value)
    formData.append('quality', String(currentQuality.value))
    // Job-Modus: echter Fortschritt per Server-Sent Events. Ein Backend ohne
    // Job-Modus ignoriert das Feld und antwortet wie bisher synchron.
    formData.append('mode', 'job')

    updateFileProgress(fileData.id, 0, 'converting')
    let jobId: string | null = null

    try {
      const response = await axios.post<ServerConvertResult | ServerJobCreated>(
        `${API_BASE}/convert`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000,
          signal,
          // Upload belegt 0–50 %, die Verarbeitung auf dem Server 50–100 %
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total ?? 1
            const percent = Math.round((progressEvent.loaded * UPLOAD_SHARE) / total)
            updateFileProgress(fileData.id, Math.min(percent, UPLOAD_SHARE))
          },
        }
      )

      let data: ServerConvertResult = response.data
      if (isServerJob(data)) {
        jobId = data.jobId
        updateFileProgress(fileData.id, UPLOAD_SHARE)
        data = await followServerJob(
          data.jobId,
          (percent) => {
            const total = UPLOAD_SHARE + Math.round((percent * (100 - UPLOAD_SHARE)) / 100)
            updateFileProgress(fileData.id, Math.min(total, 99))
          },
          signal
        )
        jobId = null
      }
      if (!data?.ok) throw new Error(data?.error ?? 'Konvertierung fehlgeschlagen')
      if (!data.url) throw new Error('Server-Antwort unvollständig: url fehlt')
      if (!data.filename) throw new Error('Server-Antwort unvollständig: filename fehlt')

      updateFileProgress(fileData.id, 100, 'completed')
      const file = audioFiles.value.find((f) => f.id === fileData.id)

      if (file) {
        const urlPath = data.url.startsWith('/') ? data.url : `/${data.url}`
        file.convertedUrl = `/audiokonverter${urlPath}`
        file.convertedName = getConvertedFileName(fileData.name, currentFormat.value)
        file.convertedFormat = currentFormat.value.toUpperCase()
        file.convertedSize = data.size ?? null
        file.status = 'completed'
        file.processedLocally = false
        convertedFiles.value.push(file)
      }

      return {
        success: true,
        data: { ok: true, url: data.url, filename: data.filename, size: data.size },
      }
    } catch (error) {
      // Abbruch durch den Nutzer ist kein Fehler: Datei sauber zurücksetzen,
      // die hochgeladene Datei bleibt in der Liste erhalten.
      if (signal?.aborted || axios.isCancel(error)) {
        if (jobId) cancelServerJob(jobId)
        resetCancelledFile(fileData.id)
        return { success: false, error: 'cancelled' }
      }
      updateFileProgress(fileData.id, 0, 'error')
      const file = audioFiles.value.find((f) => f.id === fileData.id)
      if (file) {
        const axiosError = error as { response?: { data?: { error?: string } }; message?: string }
        file.error = axiosError.response?.data?.error ?? (error as Error).message
        file.status = 'error'
      }
      return { success: false, error: (error as Error).message }
    }
  }

  // Setzt eine wegen Abbruch unterbrochene Datei zurück auf 'pending'.
  // Die hochgeladene Quelldatei bleibt dabei vollständig erhalten.
  function resetCancelledFile(fileId: string): void {
    const file = audioFiles.value.find((f) => f.id === fileId)
    if (file && file.status !== 'completed') {
      file.status = 'pending'
      file.progress = 0
      file.error = null
    }
    delete conversionProgress.value[fileId]
  }

  async function convertFile(fileData: AudioFile, signal?: AbortSignal): Promise<ConversionResult> {
    if (wasmReady.value && shouldProcessLocally(fileData.file)) {
      return convertFileLocally(fileData, signal)
    }
    return convertFileRemotely(fileData, signal)
  }

  async function convertAllFiles(): Promise<{ cancelled: boolean }> {
    if (isConverting.value) return { cancelled: false }

    isConverting.value = true
    isCancelling.value = false
    // Frischen Abbruch-Controller für diesen Lauf erstellen
    abortController = new AbortController()
    const signal = abortController.signal

    try {
      const pendingFiles = audioFiles.value.filter(
        (f) => f.status === 'pending' || f.status === 'error'
      )
      const localFiles: AudioFile[] = []
      const serverFiles: AudioFile[] = []
      for (const fileData of pendingFiles) {
        if (wasmReady.value && shouldProcessLocally(fileData.file)) localFiles.push(fileData)
        else serverFiles.push(fileData)
      }

      // Beide Warteschlangen laufen nebeneinander; nach einem Abbruch startet
      // keine von beiden eine neue Datei.
      await Promise.all([
        runPool(localFiles, 1, signal, (f) => convertFileLocally(f, signal)),
        runPool(serverFiles, SERVER_CONCURRENCY, signal, (f) => convertFileRemotely(f, signal)),
      ])

      return { cancelled: signal.aborted }
    } finally {
      // Falls abgebrochen: noch als 'converting' markierte Dateien sauber
      // zurücksetzen. Die hochgeladenen Dateien bleiben immer erhalten.
      if (signal.aborted) {
        for (const f of audioFiles.value) {
          if (f.status === 'converting') resetCancelledFile(f.id)
        }
      }
      isConverting.value = false
      isCancelling.value = false
      abortController = null
    }
  }

  // Laufende Konvertierung sauber abbrechen (Nutzer-Aktion).
  // Bricht sowohl die Server- (axios) als auch die lokale WASM-Konvertierung ab.
  // Bereits fertige Ergebnisse und alle hochgeladenen Dateien bleiben erhalten.
  function cancelConversion(): void {
    if (!isConverting.value) return
    isCancelling.value = true
    abortController?.abort()
    // Laufende lokale FFmpeg-Konvertierung sofort beenden
    terminateFFmpeg()
  }

  function setFormat(format: AudioFormat): void {
    currentFormat.value = format
  }

  function setQuality(quality: number): void {
    currentQuality.value = quality
  }

  watch([currentFormat, currentQuality], ([format, quality]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ format, quality }))
    } catch {}
  })

  return {
    audioFiles,
    convertedFiles,
    isConverting,
    isCancelling,
    currentFormat,
    currentQuality,
    conversionProgress,
    wasmReady,
    wasmLoading,
    hasFiles,
    hasConvertedFiles,
    fileCount,
    totalSize,
    addFiles,
    removeFile,
    clearAllFiles,
    updateFileProgress,
    convertFile,
    convertAllFiles,
    cancelConversion,
    setFormat,
    setQuality,
  }
})
