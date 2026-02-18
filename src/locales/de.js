export default {
  app: {
    title: 'Audio Konverter',
    subtitle: 'Schnell & einfach konvertieren'
  },
  nav: {
    home: 'Start',
    toggleTheme: 'Design',
    language: 'Sprache'
  },
  upload: {
    title: 'Upload',
    dragDrop: 'Dateien hierher ziehen oder klicken',
    supportedFormats: 'MP3 • WAV • FLAC • OGG • AAC • M4A',
    selectFiles: 'Dateien wählen',
    filesSelected: '{count} Datei | {count} Dateien'
  },
  conversion: {
    title: 'Einstellungen',
    format: 'Format',
    quality: 'Qualität',
    qualityLevels: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      maximum: 'Maximum'
    },
    convert: 'Konvertieren',
    converting: 'Läuft...',
    progress: 'Fortschritt'
  },
  fileList: {
    title: 'Dateien',
    empty: 'Noch keine Dateien',
    remove: 'Entfernen',
    size: 'Größe'
  },
  actions: {
    clearAll: 'Leeren',
    downloadAll: 'Alle laden',
    downloading: 'Lädt...',
    downloadAllAsZip: 'ZIP Download',
    creatingZip: 'Erstelle ZIP...',
    downloadOptions: 'Download',
    exportMetadata: 'Metadaten',
    download: 'Download',
    retry: 'Wiederholen',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    confirmDeleteAll: 'Möchten Sie wirklich alle Dateien löschen?'
  },
  status: {
    processing: 'Läuft...',
    completed: 'Fertig',
    error: 'Fehler',
    ready: 'Bereit',
    waiting: 'Wartet...'
  },
  toast: {
    success: 'Erfolg',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Info',
    fileAdded: 'Hinzugefügt',
    fileRemoved: 'Entfernt',
    conversionComplete: 'Fertig!',
    conversionFailed: 'Fehlgeschlagen',
    allFilesCleared: 'Alle gelöscht',
    unsupportedFormat: 'Format nicht unterstützt',
    noFilesToDownload: 'Keine Dateien zum Download',
    zipDownloadStarted: 'ZIP-Download gestartet',
    zipDownloadFailed: 'ZIP-Download fehlgeschlagen',
    allFilesDownloaded: 'Alle Dateien heruntergeladen',
    downloadFailed: 'Download fehlgeschlagen'
  },
  errors: {
    uploadFailed: 'Upload fehlgeschlagen',
    conversionFailed: 'Konvertierung fehlgeschlagen',
    noFiles: 'Keine Dateien',
    fileTooLarge: 'Zu groß (max. 300MB)',
    networkError: 'Netzwerkfehler',
    serverError: 'Serverfehler',
    unsupportedFile: 'Nicht unterstützt'
  },
  download: {
    title: 'Download',
    subtitle: 'Laden Sie die Desktop-Version herunter',
    installer: {
      title: 'Windows Installer',
      description: 'Empfohlen für die meisten Benutzer. Automatische Installation mit Startmenü-Einträgen.',
      exe: 'Download (.exe)'
    },
    portable: {
      title: 'Portable Version',
      description: 'Keine Installation erforderlich. Ideal für USB-Sticks oder eingeschränkte Systeme.',
      x64: 'ZIP (64-bit)',
      x86: 'ZIP (32-bit)'
    },
    note: 'Alle Downloads sind virenfrei und digital signiert.'
  },
  tools: {
    title: 'Unsere Audio-Tools',
    visitTool: 'Zum Tool',
    visualizer: {
      title: 'Audio Visualizer',
      description: 'Verwandle deine Musik in ein visuelles Erlebnis! Dieses moderne Tool bietet eine professionelle Echtzeit-Visualisierung deiner Audiodaten direkt im Browser.'
    },
    normalizer: {
      title: 'Audio Normalisierer',
      description: 'Mit dem Audio Normalizer bringst du deine gesamte Musikbibliothek auf ein einheitliches Lautstärkeniveau, ohne die Klangqualität zu beeinträchtigen.'
    },
    equalizer: {
      title: 'Equalizer 19',
      description: 'Der Equalizer 19 ist ein leistungsstarker 19-Band-Equalizer, der auf der Web Audio API basiert und eine chirurgisch genaue Frequenzkontrolle ermöglicht.'
    }
  },
  faq: {
    title: 'FAQ',
    questions: {
      formats: {
        q: 'Welche Formate werden unterstützt?',
        a: 'MP3, WAV, FLAC, OGG, AAC und M4A werden unterstützt.'
      },
      quality: {
        q: 'Was bedeutet die Qualitätseinstellung?',
        a: 'Höhere Qualität = besserer Sound, größere Datei.'
      },
      privacy: {
        q: 'Sind meine Dateien sicher?',
        a: 'Ja! Dateien werden nach Konvertierung automatisch gelöscht.'
      },
      batch: {
        q: 'Kann ich mehrere Dateien gleichzeitig konvertieren?',
        a: 'Klar! Einfach mehrere Dateien hochladen.'
      }
    }
  }
}
