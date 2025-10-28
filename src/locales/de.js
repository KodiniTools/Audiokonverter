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
    subtitle: 'Laden Sie unsere Desktop-Anwendung herunter und konvertieren Sie Audiodateien offline auf Ihrem Computer. Verfügbar für Windows, macOS und Linux.',
    downloadButton: 'Herunterladen',
    systemRequirements: 'Systemanforderungen: Windows 10+, macOS 10.14+, oder moderne Linux-Distribution',
    windows: {
      exe: {
        name: 'Windows Installer',
        description: 'Empfohlen für die meisten Windows-Benutzer. Einfache Installation mit automatischer Update-Funktion.'
      },
      msi: {
        name: 'Windows MSI',
        description: 'Enterprise-Installer für Unternehmensumgebungen mit erweiterten Installationsoptionen.'
      }
    },
    macos: {
      name: 'macOS App',
      description: 'Für Apple Mac mit Intel oder Apple Silicon. Optimiert für macOS Monterey und neuer.'
    },
    linux: {
      deb: {
        name: 'Linux DEB',
        description: 'Für Debian, Ubuntu und abgeleitete Distributionen. Einfache Installation mit dpkg.'
      },
      appimage: {
        name: 'Linux AppImage',
        description: 'Universelles Format für alle Linux-Distributionen. Keine Installation erforderlich.'
      }
    },
    portable: {
      name: 'Portable Version',
      description: 'ZIP-Archiv ohne Installation. Perfekt für USB-Sticks oder temporäre Nutzung.'
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
