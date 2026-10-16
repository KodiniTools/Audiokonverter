/** Gemeinsame Helfer für die Store-Tests (audioStore, workflowStore). */
import type { AudioFile } from '@/types'

/** Lässt ausstehende Promises und Vue-Watcher durchlaufen. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Kleine Audiodatei; die Größe entscheidet nur über lokal/Server, der Inhalt ist egal. */
export function audioFile(name = 'song.wav'): File {
  return new File([new Uint8Array(16)], name, { type: 'audio/wav' })
}

/** Antwort von POST /api/convert wie im Backend (backend/server.js). */
export function serverOk(filename = 'song-abc123.mp3', size = 1234) {
  return { data: { ok: true, url: `/files/${filename}`, filename, format: 'mp3', size } }
}

/**
 * Promise, die erst beim Abbruch des Signals mit einem Fehler endet –
 * bildet eine laufende Konvertierung nach, die der Nutzer abbricht.
 */
export function pendingUntilAborted<T>(signal?: AbortSignal): Promise<T> {
  return new Promise<T>((_, reject) => {
    signal?.addEventListener('abort', () => reject(new Error('canceled')))
  })
}

/** Sucht eine Datei per ID und bricht den Test ab, wenn sie fehlt. */
export function byId(files: AudioFile[], id: string): AudioFile {
  const file = files.find((f) => f.id === id)
  if (!file) throw new Error(`Datei ${id} nicht in der Liste`)
  return file
}
