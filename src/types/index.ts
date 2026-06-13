// ── Audio formats ─────────────────────────────────────────────────────────────
export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'ogg' | 'aac' | 'm4a' | 'opus' | 'aiff' | 'wma'

export type FileStatus = 'pending' | 'converting' | 'completed' | 'error'

export type Theme = 'light' | 'dark'

export type WorkflowStep = 'upload' | 'configure' | 'converting' | 'completed'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

// ── Core domain objects ───────────────────────────────────────────────────────
export interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: FileStatus
  progress: number
  convertedUrl: string | null
  convertedName: string | null
  convertedSize: number | null
  convertedFormat: string | null
  processedLocally: boolean
  error: string | null
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export interface ToastAction {
  label: string
  callback: () => void
}

export interface Toast {
  id: number
  type: ToastType
  title: string
  message: string
  duration: number
  actions: ToastAction[]
  closeable: boolean
}

export interface ToastOptions {
  message?: string
  duration?: number
  actions?: ToastAction[]
  closeable?: boolean
}

// ── Workflow ──────────────────────────────────────────────────────────────────
export interface FileSummary {
  total: number
  pending: number
  converting: number
  completed: number
  error: number
}

export interface ProcessingModeSummary {
  local: number
  server: number
  wasmReady: boolean
  wasmLoading: boolean
}

export interface WorkflowTransition {
  from: WorkflowStep
  to: WorkflowStep
  at: number
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface ConvertApiResponse {
  ok: boolean
  url: string
  filename: string
  size?: number
  error?: string
}

export interface ConversionResult {
  success: boolean
  data?: ConvertApiResponse
  error?: string
}

export interface SavedSettings {
  format?: AudioFormat
  quality?: number
}

// ── IndexedDB shared files ────────────────────────────────────────────────────
export interface SharedFile {
  id?: number
  name: string
  blob: Blob
  mimeType: string
  source: 'audiokonverter'
  sharedAt: number
}

export interface SharedFileInput {
  name: string
  blob: Blob
}
