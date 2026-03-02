import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { shouldProcessLocally, convertLocally, loadFFmpeg } from '@/services/WasmAudioService'

export const useAudioStore = defineStore('audio', () => {
  // State
  const audioFiles = ref([])
  const convertedFiles = ref([])
  const isConverting = ref(false)
  const currentFormat = ref('mp3')
  const currentQuality = ref(7)
  const conversionProgress = ref({})
  const wasmReady = ref(false)
  const wasmLoading = ref(false)

  // Computed
  const hasFiles = computed(() => audioFiles.value.length > 0)
  const hasConvertedFiles = computed(() => convertedFiles.value.length > 0)

  const fileCount = computed(() => audioFiles.value.length)
  const totalSize = computed(() => {
    return audioFiles.value.reduce((sum, file) => sum + file.size, 0)
  })

  // Actions
  function getConvertedFileName(originalName, newFormat) {
    const lastDotIndex = originalName.lastIndexOf('.')
    const baseName = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
    return `${baseName}.${newFormat}`
  }


  function addFiles(files) {
    const newFiles = Array.from(files).map(file => ({
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
      error: null
    }))

    audioFiles.value.push(...newFiles)

    // Pre-load FFmpeg.wasm if any file qualifies for local processing
    if (newFiles.some(f => f.processedLocally) && !wasmReady.value && !wasmLoading.value) {
      preloadWasm()
    }

    return newFiles
  }

  async function preloadWasm() {
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

  function removeFile(fileId) {
    const index = audioFiles.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      audioFiles.value.splice(index, 1)
    }
  }

  function clearAllFiles() {
    audioFiles.value = []
    convertedFiles.value = []
    conversionProgress.value = {}
    isConverting.value = false
  }

  function updateFileProgress(fileId, progress, status = null) {
    const file = audioFiles.value.find(f => f.id === fileId)
    if (file) {
      file.progress = progress
      if (status) file.status = status
    }
    conversionProgress.value[fileId] = progress
  }

  // --- Local conversion via FFmpeg.wasm ---
  async function convertFileLocally(fileData) {
    updateFileProgress(fileData.id, 0, 'converting')

    try {
      const blob = await convertLocally(
        fileData.file,
        currentFormat.value,
        currentQuality.value,
        (progress) => {
          updateFileProgress(fileData.id, Math.min(progress, 99))
        }
      )

      updateFileProgress(fileData.id, 100, 'completed')
      const file = audioFiles.value.find(f => f.id === fileData.id)

      if (file) {
        const blobUrl = URL.createObjectURL(blob)
        file.convertedUrl = blobUrl
        file.convertedName = getConvertedFileName(fileData.name, currentFormat.value)
        file.convertedFormat = currentFormat.value.toUpperCase()
        file.convertedSize = blob.size
        file.status = 'completed'
        file.processedLocally = true

        convertedFiles.value.push(file)
      }
      return { success: true }
    } catch (error) {
      console.error('Lokale Konvertierung fehlgeschlagen:', error)
      console.log('Fallback auf Server-Konvertierung...')
      return convertFileRemotely(fileData)
    }
  }

  // --- Remote conversion via backend API ---
  async function convertFileRemotely(fileData) {
    const formData = new FormData()
    formData.append('file', fileData.file)
    formData.append('format', currentFormat.value)
    formData.append('quality', currentQuality.value)

    updateFileProgress(fileData.id, 0, 'converting')

    try {
      const response = await axios.post('/audiokonverter/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          updateFileProgress(fileData.id, Math.min(percentCompleted, 90))
        }
      })

      if (!response.data) {
        throw new Error('Keine Antwort vom Server')
      }

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Konvertierung fehlgeschlagen')
      }

      if (!response.data.url) {
        throw new Error('Server-Antwort unvollständig: url fehlt')
      }

      if (!response.data.filename) {
        throw new Error('Server-Antwort unvollständig: filename fehlt')
      }

      updateFileProgress(fileData.id, 100, 'completed')
      const file = audioFiles.value.find(f => f.id === fileData.id)

      if (file) {
        const urlPath = response.data.url.startsWith('/')
          ? response.data.url
          : '/' + response.data.url

        file.convertedUrl = '/audiokonverter' + urlPath
        file.convertedName = getConvertedFileName(fileData.name, currentFormat.value)
        file.convertedFormat = currentFormat.value.toUpperCase()
        file.status = 'completed'
        file.processedLocally = false
        file.convertedSize = response.data.size || null

        convertedFiles.value.push(file)
      }
      return { success: true, data: response.data }
    } catch (error) {
      updateFileProgress(fileData.id, 0, 'error')
      const file = audioFiles.value.find(f => f.id === fileData.id)
      if (file) {
        file.error = error.response?.data?.error || error.message
        file.status = 'error'
      }
      return { success: false, error: error.message }
    }
  }

  // --- Hybrid dispatch: decide local vs remote ---
  async function convertFile(fileData) {
    if (wasmReady.value && shouldProcessLocally(fileData.file)) {
      return convertFileLocally(fileData)
    }
    return convertFileRemotely(fileData)
  }

  async function convertAllFiles() {
    if (isConverting.value) return

    isConverting.value = true
    try {
      const pendingFiles = audioFiles.value.filter(f => f.status === 'pending' || f.status === 'error')

      for (const fileData of pendingFiles) {
        // Use WASM only if it's ALREADY loaded and file is small enough
        if (wasmReady.value && shouldProcessLocally(fileData.file)) {
          await convertFileLocally(fileData)
        } else {
          await convertFileRemotely(fileData)
        }
      }
    } finally {
      isConverting.value = false
    }
  }

  async function downloadFile(fileData) {
    if (!fileData.convertedUrl) return

    try {
      const response = await fetch(fileData.convertedUrl)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileData.convertedName || `converted-${fileData.name}`
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(fileData.convertedUrl, '_blank')
    }
  }

  async function downloadAllFiles() {
    const completedFiles = audioFiles.value.filter(f => f.status === 'completed' && f.convertedUrl)

    if (completedFiles.length === 0) {
      return
    }

    for (const fileData of completedFiles) {
      await downloadFile(fileData)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  function setFormat(format) {
    currentFormat.value = format
  }

  function setQuality(quality) {
    currentQuality.value = quality
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    // State
    audioFiles,
    convertedFiles,
    isConverting,
    currentFormat,
    currentQuality,
    conversionProgress,
    wasmReady,
    wasmLoading,

    // Computed
    hasFiles,
    hasConvertedFiles,
    fileCount,
    totalSize,

    // Actions
    addFiles,
    removeFile,
    clearAllFiles,
    updateFileProgress,
    convertFile,
    convertAllFiles,
    downloadFile,
    downloadAllFiles,
    setFormat,
    setQuality,
    formatFileSize
  }
})
