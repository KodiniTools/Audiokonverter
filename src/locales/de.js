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
    downloadAsZip: 'Als ZIP herunterladen',
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
    unsupportedFormat: 'Nicht unterstütztes Format',
    zipDownloadStarted: 'ZIP-Download gestartet',
    zipDownloadFailed: 'ZIP-Download fehlgeschlagen'
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
    securityWarning: {
      title: 'Wichtiger Hinweis zu Windows Defender',
      description: 'Windows Defender kann die Installer-Dateien als potenzielle Bedrohung kennzeichnen. Dies ist ein bekannter Fehlalarm (False Positive), da unsere App nicht digital signiert ist.',
      learnMore: 'Mehr erfahren und Installationsanleitung ansehen',
      why: {
        title: 'Warum passiert das?',
        description: 'Unsere Software ist vollkommen sicher, aber Windows Defender stuft unbekannte Programme ohne digitales Zertifikat als verdächtig ein. Dies ist eine Vorsichtsmaßnahme von Microsoft, um Nutzer zu schützen.'
      },
      howToInstall: {
        title: 'So installieren Sie trotzdem:',
        steps: [
          'Laden Sie die gewünschte Datei herunter',
          'Wenn Windows Defender eine Warnung zeigt, klicken Sie auf "Weitere Informationen"',
          'Klicken Sie dann auf "Trotzdem ausführen" oder "Trotzdem herunterladen"',
          'Folgen Sie den Installationsanweisungen'
        ]
      },
      recommendation: 'Tipp: Die Portable Version (ZIP) löst seltener Antivirus-Warnungen aus und benötigt keine Installation.'
    },
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
      description: 'Keine Installation nötig! Entpacken und direkt starten. Löst selten Antivirus-Warnungen aus.'
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
  },
  licenses: {
    title: 'Open Source Lizenzen',
    subtitle: 'Diese Anwendung verwendet die folgenden Open-Source-Bibliotheken und -Tools',
    homepage: 'Homepage',
    licenseText: 'Lizenztext',
    footer: 'Wir danken allen Open-Source-Entwicklern für ihre großartige Arbeit. Alle aufgeführten Marken und Namen gehören ihren jeweiligen Eigentümern.',
    items: {
      vue: {
        name: 'Vue.js',
        type: 'MIT License',
        description: 'Das progressive JavaScript-Framework für den Aufbau moderner Benutzeroberflächen. Vue.js ist das Herzstück dieser Anwendung.',
        url: 'https://vuejs.org',
        licenseUrl: 'https://github.com/vuejs/core/blob/main/LICENSE'
      },
      vite: {
        name: 'Vite',
        type: 'MIT License',
        description: 'Modernes Frontend-Build-Tool mit blitzschnellem Hot Module Replacement (HMR) für eine optimale Entwicklererfahrung.',
        url: 'https://vitejs.dev',
        licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE'
      },
      pinia: {
        name: 'Pinia',
        type: 'MIT License',
        description: 'Intuitives, typsicheres State-Management für Vue.js. Pinia verwaltet den gesamten Anwendungsstatus.',
        url: 'https://pinia.vuejs.org',
        licenseUrl: 'https://github.com/vuejs/pinia/blob/v2/LICENSE'
      },
      vueI18n: {
        name: 'Vue I18n',
        type: 'MIT License',
        description: 'Internationalisierungs-Plugin für Vue.js, das die mehrsprachige Unterstützung dieser Anwendung ermöglicht.',
        url: 'https://vue-i18n.intlify.dev',
        licenseUrl: 'https://github.com/intlify/vue-i18n-next/blob/master/LICENSE'
      },
      axios: {
        name: 'Axios',
        type: 'MIT License',
        description: 'Promise-basierter HTTP-Client für Browser und Node.js zur Kommunikation mit dem Backend-Server.',
        url: 'https://axios-http.com',
        licenseUrl: 'https://github.com/axios/axios/blob/v1.x/LICENSE'
      },
      jszip: {
        name: 'JSZip',
        type: 'MIT / GPL-3.0',
        description: 'JavaScript-Bibliothek zum Erstellen, Lesen und Bearbeiten von ZIP-Dateien, verwendet für die "Als ZIP herunterladen"-Funktion.',
        url: 'https://stuk.github.io/jszip',
        licenseUrl: 'https://github.com/Stuk/jszip/blob/main/LICENSE.markdown'
      },
      fontawesome: {
        name: 'Font Awesome',
        type: 'Font: SIL OFL 1.1 / Icons: CC BY 4.0 / Code: MIT',
        description: 'Umfassende Icon-Bibliothek mit Tausenden von Icons für eine moderne und intuitive Benutzeroberfläche.',
        url: 'https://fontawesome.com',
        licenseUrl: 'https://fontawesome.com/license/free'
      },
      ffmpeg: {
        name: 'FFmpeg',
        type: 'LGPL 2.1+ / GPL 2+',
        description: 'Leistungsstarkes Multimedia-Framework zur Dekodierung, Kodierung und Konvertierung von Audio- und Videodateien. FFmpeg ist die Konvertierungs-Engine des Backends.',
        url: 'https://ffmpeg.org',
        licenseUrl: 'https://ffmpeg.org/legal.html'
      },
      nodejs: {
        name: 'Node.js',
        type: 'MIT License',
        description: 'JavaScript-Laufzeitumgebung, die das Backend dieser Anwendung betreibt und serverseitige Verarbeitung ermöglicht.',
        url: 'https://nodejs.org',
        licenseUrl: 'https://github.com/nodejs/node/blob/main/LICENSE'
      },
      express: {
        name: 'Express.js',
        type: 'MIT License',
        description: 'Minimales und flexibles Node.js-Web-Application-Framework für die Backend-API-Endpunkte.',
        url: 'https://expressjs.com',
        licenseUrl: 'https://github.com/expressjs/express/blob/master/LICENSE'
      },
      multer: {
        name: 'Multer',
        type: 'MIT License',
        description: 'Node.js-Middleware für die Verarbeitung von Multipart/Form-Data, verwendet für den Datei-Upload.',
        url: 'https://github.com/expressjs/multer',
        licenseUrl: 'https://github.com/expressjs/multer/blob/master/LICENSE'
      },
      repository: {
        name: 'Audio Konverter - Quellcode',
        type: 'Open Source',
        description: 'Der vollständige Quellcode dieser Anwendung ist öffentlich auf GitHub verfügbar. Beiträge, Issues und Feedback sind willkommen!',
        url: 'https://github.com/KodiniTools/Audiokonverter',
        licenseUrl: 'https://github.com/KodiniTools/Audiokonverter/blob/main/LICENSE'
      }
    }
  }
}
