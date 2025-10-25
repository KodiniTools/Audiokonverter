export default {
  app: {
    title: 'Audio Konverter',
    subtitle: 'Konvertiere deine Audiodateien schnell und einfach'
  },
  nav: {
    home: 'Startseite',
    toggleTheme: 'Design wechseln',
    language: 'Sprache'
  },
  upload: {
    title: 'Dateien hochladen',
    dragDrop: 'Dateien hierher ziehen oder klicken zum Auswählen',
    supportedFormats: 'Unterstützte Formate: MP3, WAV, FLAC, OGG, AAC, M4A',
    selectFiles: 'Dateien auswählen',
    filesSelected: '{count} Datei ausgewählt | {count} Dateien ausgewählt'
  },
  conversion: {
    title: 'Konvertierungseinstellungen',
    format: 'Zielformat',
    quality: 'Qualität',
    qualityLevels: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      maximum: 'Maximum'
    },
    convert: 'Konvertieren',
    converting: 'Konvertiere...',
    progress: 'Fortschritt'
  },
  fileList: {
    title: 'Ausgewählte Dateien',
    empty: 'Keine Dateien ausgewählt',
    remove: 'Entfernen',
    size: 'Größe'
  },
  actions: {
    clearAll: 'Alle löschen',
    downloadAll: 'Alle herunterladen',
    downloadOptions: 'Download-Optionen',
    exportMetadata: 'Metadaten exportieren',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    download: 'Herunterladen',
    retry: 'Wiederholen'
  },
  status: {
    processing: 'Verarbeite...',
    completed: 'Abgeschlossen',
    error: 'Fehler',
    ready: 'Bereit',
    waiting: 'Warte...'
  },
  toast: {
    success: 'Erfolg',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Information',
    fileAdded: 'Datei hinzugefügt',
    fileRemoved: 'Datei entfernt',
    conversionComplete: 'Konvertierung abgeschlossen',
    conversionFailed: 'Konvertierung fehlgeschlagen',
    allFilesCleared: 'Alle Dateien gelöscht',
    unsupportedFormat: 'Nicht unterstütztes Format'
  },
  errors: {
    uploadFailed: 'Upload fehlgeschlagen',
    conversionFailed: 'Konvertierung fehlgeschlagen',
    noFiles: 'Keine Dateien ausgewählt',
    fileTooLarge: 'Datei zu groß (max. 300MB)',
    networkError: 'Netzwerkfehler',
    serverError: 'Serverfehler',
    unsupportedFile: 'Nicht unterstützte Datei'
  },
  faq: {
    title: 'Häufig gestellte Fragen',
    questions: {
      formats: {
        q: 'Welche Formate werden unterstützt?',
        a: 'Wir unterstützen MP3, WAV, FLAC, OGG, AAC und M4A Formate.'
      },
      quality: {
        q: 'Was bedeuten die Qualitätsstufen?',
        a: 'Die Qualität bestimmt die Bitrate und Kompression der Ausgabedatei. Höhere Qualität bedeutet besseren Klang, aber größere Dateien.'
      },
      privacy: {
        q: 'Sind meine Dateien sicher?',
        a: 'Ja, alle Dateien werden nur temporär verarbeitet und automatisch nach der Konvertierung gelöscht.'
      },
      batch: {
        q: 'Kann ich mehrere Dateien gleichzeitig konvertieren?',
        a: 'Ja, Sie können mehrere Dateien hochladen und sie werden nacheinander konvertiert.'
      }
    }
  }
}
