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

      <!-- Animated background waves -->
      <div class="upload-bg-waves">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>

      <h3 class="upload-title">{{ t('upload.dragDrop') }}</h3>
      <p class="upload-subtitle">{{ t('upload.supportedFormats') }}</p>

      <button class="btn btn-primary upload-btn" @click.stop="triggerFileInput">
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
  margin: 0;
  animation: slideInUp 0.5s ease 0.15s both;
  position: relative;
  z-index: 1;
}

.drop-area {
  border: 2px dashed rgba(245, 244, 214, 0.35);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.drop-area:hover {
  border-color: rgba(245, 244, 214, 0.6);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.drop-area.drag-over {
  border-color: #c9984d;
  background: rgba(201, 152, 77, 0.2);
  transform: scale(1.02);
  box-shadow: 0 0 40px rgba(201, 152, 77, 0.3);
}

/* Animated background waves */
.upload-bg-waves {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.4;
}

.wave {
  position: absolute;
  bottom: -50%;
  left: -10%;
  width: 120%;
  height: 100%;
  border-radius: 40%;
  animation: waveFloat 8s ease-in-out infinite;
}

.wave-1 {
  background: rgba(201, 152, 77, 0.08);
  animation-delay: 0s;
}

.wave-2 {
  background: rgba(245, 244, 214, 0.05);
  animation-delay: -2s;
  animation-duration: 10s;
}

.wave-3 {
  background: rgba(1, 79, 153, 0.06);
  animation-delay: -4s;
  animation-duration: 12s;
}

.drag-over .upload-bg-waves {
  opacity: 0.8;
}

.upload-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F5F4D6;
  margin-bottom: 0.35rem;
  position: relative;
}

.upload-subtitle {
  font-size: 0.8rem;
  color: rgba(245, 244, 214, 0.6);
  margin-bottom: 1rem;
  position: relative;
}

.upload-btn {
  padding: 0.65rem 1.75rem;
  font-size: 0.9rem;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(245, 244, 214, 0.3);
  color: #F5F4D6;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(245, 244, 214, 0.5);
  transform: translateY(-1px) scale(1.02);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes waveFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(3deg);
  }
}

@media (max-width: 768px) {
  .drop-area {
    padding: 1.5rem 1rem;
  }

  .upload-title {
    font-size: 1rem;
  }

  .upload-subtitle {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .drop-area {
    padding: 1.25rem 0.75rem;
    border-radius: 12px;
  }

  .upload-title {
    font-size: 0.95rem;
  }

  .upload-subtitle {
    font-size: 0.7rem;
    margin-bottom: 0.75rem;
  }

  .upload-btn {
    padding: 0.55rem 1.25rem;
    font-size: 0.85rem;
    min-height: 44px;
  }
}
</style>
