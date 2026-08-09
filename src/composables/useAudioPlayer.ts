import { ref, computed } from 'vue'
import type { AudioFile } from '@/types'

// Ein einziges, global geteiltes Audio-Element fuer den Sticky-Player.
const audioEl: HTMLAudioElement | null = typeof Audio !== 'undefined' ? new Audio() : null

const currentFileId = ref<string | null>(null)
const currentName = ref<string>('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)

// Object-URLs der Originaldateien (werden bei Entfernen wieder freigegeben)
const objectUrls = new Map<string, string>()
let listenersAttached = false

function attachListeners(): void {
  const el = audioEl
  if (!el || listenersAttached) return
  listenersAttached = true
  el.addEventListener('timeupdate', () => {
    currentTime.value = el.currentTime
  })
  const syncDuration = () => {
    duration.value = Number.isFinite(el.duration) ? el.duration : 0
  }
  el.addEventListener('loadedmetadata', syncDuration)
  el.addEventListener('durationchange', syncDuration)
  el.addEventListener('play', () => {
    isPlaying.value = true
  })
  el.addEventListener('pause', () => {
    isPlaying.value = false
  })
  el.addEventListener('ended', () => {
    isPlaying.value = false
    currentTime.value = 0
  })
  el.volume = volume.value
}

function srcFor(file: AudioFile): string {
  if (file.status === 'completed' && file.convertedUrl) {
    return file.convertedUrl
  }
  let url = objectUrls.get(file.id)
  if (!url) {
    url = URL.createObjectURL(file.file)
    objectUrls.set(file.id, url)
  }
  return url
}

export function useAudioPlayer() {
  attachListeners()

  // Klick auf eine Datei: laden & abspielen. Erneuter Klick auf denselben
  // Titel schaltet Play/Pause um.
  function playFile(file: AudioFile): void {
    if (!audioEl) return
    if (currentFileId.value === file.id) {
      toggle()
      return
    }
    audioEl.src = srcFor(file)
    currentFileId.value = file.id
    currentName.value = file.name
    currentTime.value = 0
    duration.value = 0
    audioEl.volume = volume.value
    void audioEl.play().catch(() => {
      isPlaying.value = false
    })
  }

  function toggle(): void {
    if (!audioEl || !currentFileId.value) return
    if (isPlaying.value) {
      audioEl.pause()
    } else {
      void audioEl.play().catch(() => {
        isPlaying.value = false
      })
    }
  }

  function seek(time: number): void {
    if (!audioEl) return
    audioEl.currentTime = time
    currentTime.value = time
  }

  function setVolume(v: number): void {
    volume.value = v
    if (audioEl) audioEl.volume = v
  }

  // Eine Datei wurde entfernt: ggf. Wiedergabe stoppen und URL freigeben.
  function releaseFile(fileId: string): void {
    if (currentFileId.value === fileId) {
      if (audioEl) {
        audioEl.pause()
        audioEl.removeAttribute('src')
        audioEl.load()
      }
      currentFileId.value = null
      currentName.value = ''
      isPlaying.value = false
      currentTime.value = 0
      duration.value = 0
    }
    const url = objectUrls.get(fileId)
    if (url) {
      URL.revokeObjectURL(url)
      objectUrls.delete(fileId)
    }
  }

  // Alle Dateien entfernt: komplett zuruecksetzen.
  function stopAll(): void {
    if (audioEl) {
      audioEl.pause()
      audioEl.removeAttribute('src')
      audioEl.load()
    }
    currentFileId.value = null
    currentName.value = ''
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
  }

  function isCurrent(fileId: string): boolean {
    return currentFileId.value === fileId
  }

  const hasTrack = computed(() => currentFileId.value !== null)

  return {
    currentFileId,
    currentName,
    isPlaying,
    currentTime,
    duration,
    volume,
    hasTrack,
    playFile,
    toggle,
    seek,
    setVolume,
    releaseFile,
    stopAll,
    isCurrent,
  }
}
