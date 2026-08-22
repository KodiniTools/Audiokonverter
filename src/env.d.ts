/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// ── File System Access API ────────────────────────────────────────────────────
// Minimal typings for the "Save As" picker used by src/utils/fileSaver.ts.
// Not yet part of the standard DOM lib, so declared here.
interface FileSystemWritableFileStream {
  write(data: Blob | BufferSource | string): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>
}

interface SaveFilePickerAcceptType {
  description?: string
  accept: Record<string, string | string[]>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: SaveFilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
}
