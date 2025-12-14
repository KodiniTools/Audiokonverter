export default {
  app: {
    title: '🎵 Audio Konverter',
    subtitle: 'Schnell & einfach konvertieren'
  },
  nav: {
    home: '🏠 Start',
    toggleTheme: '🎨 Design',
    language: '🌍 Sprache'
  },
  upload: {
    title: '📁 Upload',
    dragDrop: '📂 Dateien hierher ziehen oder klicken',
    supportedFormats: 'MP3 • WAV • FLAC • OGG • AAC • M4A',
    selectFiles: '📁 Dateien wählen',
    filesSelected: '{count} Datei | {count} Dateien'
  },
  conversion: {
    title: '⚙️ Einstellungen',
    format: '🎯 Format',
    quality: '✨ Qualität',
    qualityLevels: {
      low: '📉 Niedrig',
      medium: '📊 Mittel',
      high: '📈 Hoch',
      maximum: '🚀 Maximum'
    },
    convert: '🔄 Konvertieren',
    converting: '⏳ Läuft...',
    progress: '📊 Fortschritt'
  },
  fileList: {
    title: '📋 Dateien',
    empty: 'Noch keine Dateien',
    remove: '🗑️',
    size: '📦 Größe'
  },
  actions: {
    clearAll: '🗑️ Leeren',
    downloadAllAsZip: '📦 ZIP Download',
    creatingZip: '⏳ Erstelle ZIP...',
    downloadOptions: '⬇️ Download',
    exportMetadata: '📄 Metadaten',
    download: '⬇️',
    retry: '🔄'
  },
  status: {
    processing: '⏳ Läuft...',
    completed: '✅ Fertig',
    error: '❌ Fehler',
    ready: '🟢 Bereit',
    waiting: '⏸️ Wartet...'
  },
  toast: {
    success: '✅ Erfolg',
    error: '❌ Fehler',
    warning: '⚠️ Warnung',
    info: 'ℹ️ Info',
    fileAdded: '✅ Hinzugefügt',
    fileRemoved: '🗑️ Entfernt',
    conversionComplete: '🎉 Fertig!',
    conversionFailed: '❌ Fehlgeschlagen',
    allFilesCleared: '🗑️ Alle gelöscht',
    unsupportedFormat: '⚠️ Format nicht unterstützt',
    noFilesToDownload: '📭 Keine Dateien zum Download',
    zipDownloadStarted: '📦 ZIP-Download gestartet',
    zipDownloadFailed: '❌ ZIP-Download fehlgeschlagen'
  },
  errors: {
    uploadFailed: '❌ Upload fehlgeschlagen',
    conversionFailed: '❌ Konvertierung fehlgeschlagen',
    noFiles: '📭 Keine Dateien',
    fileTooLarge: '📦 Zu groß (max. 300MB)',
    networkError: '🌐 Netzwerkfehler',
    serverError: '🖥️ Serverfehler',
    unsupportedFile: '⚠️ Nicht unterstützt'
  },
  faq: {
    title: '❓ FAQ',
    questions: {
      formats: {
        q: '🎵 Welche Formate?',
        a: 'MP3, WAV, FLAC, OGG, AAC und M4A werden unterstützt.'
      },
      quality: {
        q: '✨ Was bedeutet Qualität?',
        a: 'Höhere Qualität = besserer Sound, größere Datei.'
      },
      privacy: {
        q: '🔒 Sind meine Dateien sicher?',
        a: 'Ja! Dateien werden nach Konvertierung automatisch gelöscht.'
      },
      batch: {
        q: '📚 Mehrere Dateien gleichzeitig?',
        a: 'Klar! Einfach mehrere Dateien hochladen.'
      }
    }
  }
}
