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
  downloads: {
    title: 'Desktop-App Herunterladen',
    subtitle: 'Laden Sie unsere Windows Desktop-Anwendung herunter und konvertieren Sie Audiodateien offline auf Ihrem Computer.',
    downloadButton: 'Herunterladen',
    recommended: 'Empfohlen',
    systemRequirements: 'Systemanforderungen: Windows 10 oder neuer (64-bit empfohlen)',
    windows: {
      exe: {
        name: 'Windows Installer (64-bit)',
        description: 'Empfohlen für die meisten Windows-Benutzer. Einfache Installation mit automatischer Update-Funktion.'
      },
      msi64: {
        name: 'Windows MSI (64-bit)',
        description: 'Enterprise-Installer für Unternehmensumgebungen. Erweiterte Installationsoptionen für IT-Administratoren.'
      },
      msi32: {
        name: 'Windows MSI (32-bit)',
        description: 'Für ältere Windows-Systeme. Kompatibel mit 32-bit Windows-Versionen.'
      }
    },
    portable64: {
      name: 'Portable Version (64-bit)',
      description: 'ZIP-Archiv ohne Installation. Perfekt für USB-Sticks oder temporäre Nutzung auf modernen PCs.'
    },
    portable32: {
      name: 'Portable Version (32-bit)',
      description: 'ZIP-Archiv für ältere Systeme. Keine Installation erforderlich, läuft von USB oder lokalem Ordner.'
    }
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
