import { ref, computed } from 'vue'

export function useElectron() {
  // Check if running in Electron
  const isElectron = computed(() => {
    return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron
  })

  const platform = computed(() => {
    if (isElectron.value) {
      return window.electronAPI.platform
    }
    return 'web'
  })

  // File operations for Electron
  async function selectFiles() {
    if (!isElectron.value) {
      console.warn('selectFiles is only available in Electron')
      return null
    }

    try {
      const filePaths = await window.electronAPI.selectFile()
      if (!filePaths || filePaths.length === 0) {
        return null
      }

      // Read all selected files
      const files = []
      for (const filePath of filePaths) {
        const result = await window.electronAPI.readFile(filePath)
        if (result.success) {
          // Create a File object from the buffer
          const blob = new Blob([result.data])
          const file = new File([blob], result.name, {
            type: getMimeType(result.name)
          })
          files.push(file)
        }
      }

      return files.length > 0 ? files : null
    } catch (error) {
      console.error('Error selecting files:', error)
      return null
    }
  }

  async function saveFile(data, defaultName) {
    if (!isElectron.value) {
      console.warn('saveFile is only available in Electron')
      return false
    }

    try {
      const filePath = await window.electronAPI.saveFile(defaultName)
      if (!filePath) {
        return false
      }

      const result = await window.electronAPI.writeFile(filePath, data)
      return result.success
    } catch (error) {
      console.error('Error saving file:', error)
      return false
    }
  }

  async function getAppPath() {
    if (!isElectron.value) {
      return null
    }

    try {
      return await window.electronAPI.getAppPath()
    } catch (error) {
      console.error('Error getting app path:', error)
      return null
    }
  }

  // Helper function to determine MIME type
  function getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac'
    }
    return mimeTypes[ext] || 'audio/*'
  }

  return {
    isElectron,
    platform,
    selectFiles,
    saveFile,
    getAppPath
  }
}
