import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAudioStore = defineStore('audio', () => {
  // State
  const audioFiles = ref([])
  const convertedFiles = ref([])
  const isConverting = ref(false)
  const currentFormat = ref('mp3')
  const currentQuality = ref(7)
  const conversionProgress = ref({})
  const history = ref({ past: [], future: [] })

  // Computed
  const hasFiles = computed(() => audioFiles.value.length > 0)
  const hasConvertedFiles = computed(() => convertedFiles.value.length > 0)
  const canUndo = computed(() => history.value.past.length > 0)
  const canRedo = computed(() => history.value.future.length > 0)
  
  const fileCount = computed(() => audioFiles.value.length)
  const totalSize = computed(() => {
    return audioFiles.value.reduce((sum, file) => sum + file.size, 0)
  })

  // Actions
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
      error: null
    }))
    
    saveState()
    audioFiles.value.push(...newFiles)
    return newFiles
  }

  function removeFile(fileId) {
    saveState()
    const index = audioFiles.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      audioFiles.value.splice(index, 1)
    }
  }

  function clearAllFiles() {
    saveState()
    audioFiles.value = []
    convertedFiles.value = []
    conversionProgress.value = {}
  }

  function updateFileProgress(fileId, progress, status = null) {
    const file = audioFiles.value.find(f => f.id === fileId)
    if (file) {
      file.progress = progress
      if (status) file.status = status
    }
    conversionProgress.value[fileId] = progress
  }

  async function convertFile(fileData) {
    const formData = new FormData()
    formData.append('file', fileData.file)
    formData.append('format', currentFormat.value)
    formData.append('quality', currentQuality.value)

    updateFileProgress(fileData.id, 0, 'converting')

    try {
      console.log('🔄 Starte Konvertierung:', fileData.name)
      
      const response = await axios.post('/audiokonverter/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 600000, // 10 Minuten Timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log('📤 Upload Progress:', percentCompleted + '%')
          updateFileProgress(fileData.id, Math.min(percentCompleted, 90))
        }
      })

      console.log('📥 Server Response:', response.data)

      if (!response.data) {
        throw new Error('Keine Antwort vom Server')
      }

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Konvertierung fehlgeschlagen')
      }

      if (!response.data.url) {
        console.error('❌ Server Response hat kein url Feld:', response.data)
        throw new Error('Server-Antwort unvollständig: url fehlt')
      }

      if (!response.data.filename) {
        console.error('❌ Server Response hat kein filename Feld:', response.data)
        throw new Error('Server-Antwort unvollständig: filename fehlt')
      }

      updateFileProgress(fileData.id, 100, 'completed')
      const file = audioFiles.value.find(f => f.id === fileData.id)
      
      if (file) {
        // Verwende url statt output
        const urlPath = response.data.url.startsWith('/') 
          ? response.data.url 
          : '/' + response.data.url
        
        file.convertedUrl = '/audiokonverter' + urlPath
        file.convertedName = response.data.filename
        file.status = 'completed'
        
        console.log('✅ Konvertierung erfolgreich:', {
          url: file.convertedUrl,
          name: file.convertedName
        })
        
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

  async function convertAllFiles() {
    if (isConverting.value) return

    isConverting.value = true
    const pendingFiles = audioFiles.value.filter(f => f.status === 'pending' || f.status === 'error')

    for (const fileData of pendingFiles) {
      await convertFile(fileData)
    }

    isConverting.value = false
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

  // History Management
  function saveState() {
    const serializableState = audioFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      status: f.status,
      progress: f.progress,
      convertedUrl: f.convertedUrl,
      convertedName: f.convertedName,
      error: f.error
    }))
    
    history.value.past.push(JSON.stringify(serializableState))
    history.value.future = []
    
    if (history.value.past.length > 20) {
      history.value.past.shift()
    }
  }

  function undo() {
    if (!canUndo.value) return
    
    const currentSerializable = audioFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      status: f.status,
      progress: f.progress,
      convertedUrl: f.convertedUrl,
      convertedName: f.convertedName,
      error: f.error
    }))
    
    history.value.future.push(JSON.stringify(currentSerializable))
    const previousState = history.value.past.pop()
    audioFiles.value = JSON.parse(previousState)
  }

  function redo() {
    if (!canRedo.value) return
    
    const currentSerializable = audioFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      status: f.status,
      progress: f.progress,
      convertedUrl: f.convertedUrl,
      convertedName: f.convertedName,
      error: f.error
    }))
    
    history.value.past.push(JSON.stringify(currentSerializable))
    const nextState = history.value.future.pop()
    audioFiles.value = JSON.parse(nextState)
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
    
    // Computed
    hasFiles,
    hasConvertedFiles,
    canUndo,
    canRedo,
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
    undo,
    redo,
    setFormat,
    setQuality,
    formatFileSize
  }
})
