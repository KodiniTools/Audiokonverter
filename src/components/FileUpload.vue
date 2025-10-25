<template>
  <div class="file-upload-section">
    <div 
      class="drop-area"
      :class="{ 'drag-over': isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a"
        @change="handleFileSelect"
        style="display: none"
      >
      
      <div class="upload-icon">
        <i class="fas fa-cloud-upload-alt"></i>
      </div>
      
      <h3 class="upload-title">{{ t('upload.dragDrop') }}</h3>
      <p class="upload-subtitle">{{ t('upload.supportedFormats') }}</p>
      
      <button class="btn btn-primary upload-btn" @click.stop="triggerFileInput">
        <i class="fas fa-folder-open"></i>
        {{ t('upload.selectFiles') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()

const fileInput = ref(null)
const isDragging = ref(false)

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4']
const MAX_FILE_SIZE = 300 * 1024 * 1024 // 300MB

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  processFiles(files)
  event.target.value = '' // Reset input
}

function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

function processFiles(files) {
  const validFiles = []
  const errors = []

  files.forEach(file => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: ${t('errors.fileTooLarge')}`)
      return
    }

    // Check file type
    const isAudio = SUPPORTED_FORMATS.some(format => file.type.includes(format.split('/')[1])) ||
                    /\.(mp3|wav|flac|ogg|aac|m4a)$/i.test(file.name)
    
    if (!isAudio) {
      errors.push(`${file.name}: ${t('errors.unsupportedFile')}`)
      return
    }

    validFiles.push(file)
  })

  // Add valid files
  if (validFiles.length > 0) {
    audioStore.addFiles(validFiles)
    showToast('success', t('toast.fileAdded'), {
      message: `${validFiles.length} ${t('upload.filesSelected', { count: validFiles.length })}`
    })
  }

  // Show errors
  errors.forEach(error => {
    showToast('error', t('toast.error'), { message: error })
  })
}
</script>

<style scoped>
.file-upload-section {
  margin: 2rem 0;
  animation: fadeIn 0.6s ease;
}

.drop-area {
  border: 3px dashed rgba(144, 144, 144, 0.3);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--card-background);
  cursor: pointer;
  transition: all 0.3s ease;
}

.drop-area:hover {
  border-color: var(--primary-color);
  background: rgba(144, 144, 144, 0.05);
  transform: translateY(-2px);
}

.drop-area.drag-over {
  border-color: var(--primary-color);
  background: rgba(144, 144, 144, 0.1);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  animation: bounce 2s infinite;
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.upload-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.upload-btn {
  padding: 0.875rem 2rem;
  font-size: 1.125rem;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 768px) {
  .drop-area {
    padding: 2rem 1rem;
  }

  .upload-icon {
    font-size: 3rem;
  }

  .upload-title {
    font-size: 1.25rem;
  }

  .upload-subtitle {
    font-size: 0.875rem;
  }
}
</style>
