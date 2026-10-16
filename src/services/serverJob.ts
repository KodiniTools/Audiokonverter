/**
 * Fortschritt einer Server-Konvertierung im Job-Modus (backend/jobs.js).
 *
 * POST /api/convert mit mode=job antwortet mit einer Job-ID. Der Fortschritt
 * kommt per Server-Sent Events von GET /api/jobs/:id/events:
 * `progress` ({ status, percent }), am Ende `done` oder `failed`.
 */

/** Antwort des Backends wie bei der synchronen Konvertierung. */
export interface ServerConvertResult {
  ok: boolean
  url?: string
  filename?: string
  format?: string
  size?: number
  error?: string
}

/** Antwort auf POST /api/convert mit mode=job. */
export interface ServerJobCreated {
  ok: true
  jobId: string
  events: string
}

export const API_BASE = '/audiokonverter/api'

/**
 * Wie oft EventSource nach einem Verbindungsfehler neu verbinden darf, ohne
 * dass zwischendurch ein Ereignis ankam. Der Server hält den Job so lange.
 */
export const MAX_RECONNECTS = 3

/** EventSource.CLOSED; als Zahl, damit der Test eine eigene Klasse einsetzen kann. */
const EVENT_SOURCE_CLOSED = 2

function jobUrl(jobId: string): string {
  return `${API_BASE}/jobs/${encodeURIComponent(jobId)}`
}

function parseData<T>(event: Event): T | null {
  try {
    return JSON.parse((event as MessageEvent<string>).data) as T
  } catch {
    return null
  }
}

function abortError(): DOMException {
  return new DOMException('Konvertierung abgebrochen', 'AbortError')
}

export function isServerJob(data: unknown): data is ServerJobCreated {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ServerJobCreated).ok === true &&
    typeof (data as ServerJobCreated).jobId === 'string'
  )
}

/**
 * Verfolgt einen Job bis zum Ende. `onProgress` erhält 0–100 % der
 * Verarbeitung. Wird `signal` abgebrochen, endet die Promise mit einem
 * AbortError; den Job auf dem Server beendet `cancelServerJob`.
 */
export function followServerJob(
  jobId: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<ServerConvertResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())

    const source = new EventSource(`${jobUrl(jobId)}/events`)
    let failures = 0

    const cleanup = (): void => {
      source.close()
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = (): void => {
      cleanup()
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    source.addEventListener('progress', (event) => {
      failures = 0
      const data = parseData<{ percent?: unknown }>(event)
      if (typeof data?.percent === 'number' && Number.isFinite(data.percent)) {
        onProgress(Math.max(0, Math.min(100, data.percent)))
      }
    })
    source.addEventListener('done', (event) => {
      cleanup()
      const data = parseData<ServerConvertResult>(event)
      if (data) resolve(data)
      else reject(new Error('Server-Antwort unlesbar'))
    })
    source.addEventListener('failed', (event) => {
      cleanup()
      reject(new Error(parseData<ServerConvertResult>(event)?.error ?? 'conversion_failed'))
    })
    // Bei Netzfehlern verbindet EventSource selbst neu (readyState CONNECTING).
    // CLOSED heißt: Server antwortet nicht mehr mit einem Stream (z. B. 404).
    source.onerror = () => {
      failures++
      if (source.readyState === EVENT_SOURCE_CLOSED || failures > MAX_RECONNECTS) {
        cleanup()
        reject(new Error('job_connection_lost'))
      }
    }
  })
}

/** Bricht einen Job auf dem Server ab. Fehler sind egal: verwaiste Jobs räumt der Server selbst ab. */
export function cancelServerJob(jobId: string): void {
  fetch(jobUrl(jobId), { method: 'DELETE', keepalive: true }).catch(() => {})
}
