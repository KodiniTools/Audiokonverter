<template>
  <div class="file-upload-section">
    <div
      class="drop-area"
      :class="{ 'drag-over': isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a,.opus,.aiff,.aif,.wma,.webm,.weba,.zip,application/zip"
        style="display: none"
        @change="handleFileSelect"
      />
      <input
        ref="folderInput"
        type="file"
        webkitdirectory
        multiple
        style="display: none"
        @change="handleFolderSelect"
      />

      <svg
        class="upload-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      <h3 class="upload-title">{{ t('upload.dragDrop') }}</h3>
      <p class="upload-subtitle">{{ t('upload.supportedFormats') }}</p>

      <div class="upload-actions">
        <!-- Primär nur, solange noch keine Dateien da sind: danach gehört Gold „Konvertieren“ -->
        <button
          class="btn"
          :class="audioStore.hasFiles ? 'btn-secondary' : 'btn-primary'"
          @click.stop="triggerFileInput"
        >
          {{ t('upload.selectFiles') }}
        </button>
        <button class="btn btn-secondary" @click.stop="triggerFolderInput">
          {{ t('upload.selectFolder') }}
        </button>
      </div>

      <p class="upload-paste-hint">{{ t('upload.pasteHint') }}</p>
      <p class="upload-status" role="status" aria-live="polite">
        <template v-if="extractingCount > 0">{{ t('upload.extracting') }}</template>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import { MAX_FILE_SIZE, isAudioFile, isZipFile } from '@/utils/audioFiles'
import { ZipExtractError, extractAudioFromZip, type ZipErrorCode } from '@/utils/unzipAudio'

const { t } = useI18n()
const audioStore = useAudioStore()
const { showToast } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

// Laufende ZIP-Entpackvorgänge (mehrere Drops können sich überlappen)
const extractingCount = ref(0)

function triggerFileInput(): void {
  if (!fileInput.value) return
  fileInput.value.value = ''
  fileInput.value.click()
}

function triggerFolderInput(): void {
  if (!folderInput.value) return
  folderInput.value.value = ''
  folderInput.value.click()
}

function handleFolderSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  processFiles(files)
  input.value = ''
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  processFiles(files)
  input.value = ''
}

async function handleDrop(event: DragEvent): Promise<void> {
  isDragging.value = false

  const items = Array.from(event.dataTransfer?.items ?? [])
  const hasDirectories = items.some((item) => {
    const entry = item.webkitGetAsEntry()
    return entry?.isDirectory
  })

  if (hasDirectories) {
    const files = await readDroppedEntries(items)
    processFiles(files)
  } else {
    processFiles(Array.from(event.dataTransfer?.files ?? []))
  }
}

function handlePaste(event: ClipboardEvent): void {
  // Nicht eingreifen, wenn gerade in ein Eingabefeld eingefuegt wird
  const active = document.activeElement as HTMLElement | null
  if (
    active &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
  ) {
    return
  }

  const data = event.clipboardData
  if (!data) return

  const files: File[] = []
  if (data.files && data.files.length > 0) {
    files.push(...Array.from(data.files))
  } else if (data.items && data.items.length > 0) {
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
  }

  // Kein Datei-Inhalt in der Zwischenablage (z. B. reiner Text) -> nichts tun
  if (files.length === 0) return

  event.preventDefault()
  processFiles(files)
}

function readDroppedEntries(items: DataTransferItem[]): Promise<File[]> {
  const entries = items
    .map((item) => item.webkitGetAsEntry())
    .filter((e): e is FileSystemEntry => e !== null)
  return Promise.all(entries.map((entry) => readEntry(entry))).then((results) => results.flat())
}

function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File[]>((resolve) => {
      ;(entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        () => resolve([])
      )
    })
  }
  if (entry.isDirectory) {
    return new Promise<File[]>((resolve) => {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      const allEntries: FileSystemEntry[] = []
      const readBatch = () => {
        reader.readEntries(
          (batch) => {
            if (batch.length === 0) {
              Promise.all(allEntries.map((e) => readEntry(e))).then((results) =>
                resolve(results.flat())
              )
            } else {
              allEntries.push(...batch)
              readBatch()
            }
          },
          () => resolve([])
        )
      }
      readBatch()
    })
  }
  return Promise.resolve([])
}

const ZIP_ERROR_KEYS: Record<ZipErrorCode, string> = {
  archive_too_large: 'zip.archiveTooLarge',
  too_many_entries: 'zip.tooManyEntries',
  invalid_zip: 'zip.invalid',
}

/** Entpackt ein ZIP und meldet das Ergebnis; liefert die enthaltenen Audiodateien. */
async function unpackZip(archive: File, errors: string[]): Promise<File[]> {
  try {
    const result = await extractAudioFromZip(archive)

    result.tooLarge.forEach((name) => errors.push(`${name}: ${t('errors.fileTooLarge')}`))
    result.failed.forEach((name) => errors.push(`${name}: ${t('zip.entryFailed')}`))
    if (result.limitReached) errors.push(`${archive.name}: ${t('zip.limitReached')}`)

    if (result.files.length > 0) {
      const skipped =
        result.skipped.length > 0 ? ` ${t('zip.skipped', { count: result.skipped.length })}` : ''
      showToast('info', archive.name, {
        message: t('zip.extracted', { count: result.files.length }) + skipped,
      })
    } else if (result.tooLarge.length === 0 && result.failed.length === 0) {
      errors.push(`${archive.name}: ${t('zip.noAudio')}`)
    }
    return result.files
  } catch (error) {
    if (error instanceof ZipExtractError) {
      errors.push(`${archive.name}: ${t(ZIP_ERROR_KEYS[error.code])}`)
    } else {
      console.error('ZIP konnte nicht entpackt werden:', error)
      errors.push(`${archive.name}: ${t('zip.invalid')}`)
    }
    return []
  }
}

async function processFiles(files: File[]): Promise<void> {
  const validFiles: File[] = []
  const errors: string[] = []

  // ZIP-Inhalte ersetzen das Archiv an seiner Stelle, die Reihenfolge bleibt erhalten
  let candidates = files
  if (files.some((file) => isZipFile(file))) {
    candidates = []
    extractingCount.value++
    try {
      // Nacheinander, damit nie mehrere Archive gleichzeitig im Speicher liegen
      for (const file of files) {
        if (isZipFile(file)) {
          candidates.push(...(await unpackZip(file, errors)))
        } else {
          candidates.push(file)
        }
      }
    } finally {
      extractingCount.value--
    }
  }

  candidates.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: ${t('errors.fileTooLarge')}`)
      return
    }

    if (!isAudioFile(file)) {
      errors.push(`${file.name}: ${t('errors.unsupportedFile')}`)
      return
    }

    validFiles.push(file)
  })

  if (validFiles.length > 0) {
    audioStore.addFiles(validFiles)
    showToast('success', t('toast.fileAdded'), {
      message: t('upload.filesSelected', { count: validFiles.length }),
    })
  }

  errors.forEach((error) => {
    showToast('error', t('toast.error'), { message: error })
  })
}

onMounted(() => {
  window.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
/* Dropzone (Collage Maker): Fläche 1, gestrichelter kräftiger Rahmen, beim Ziehen Auswahl-Muster */
.drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-8) var(--ds-space-6);
  text-align: center;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  border-radius: var(--ds-radius-lg);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);
}

.drop-area:hover {
  border-color: var(--ds-text-3);
}

.drop-area.drag-over {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
}

.upload-icon {
  width: 32px;
  height: 32px;
  color: var(--ds-text-2);
}

.upload-title {
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.upload-subtitle {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}

.upload-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}

.upload-paste-hint {
  font-size: var(--ds-text-xs);
  color: var(--ds-text-2);
}

.upload-status {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
}

.upload-status:empty {
  display: none;
}

@media (max-width: 480px) {
  .drop-area {
    padding: var(--ds-space-6) var(--ds-space-4);
  }

  .upload-actions .btn {
    flex: 1 1 100%;
  }
}
</style>
