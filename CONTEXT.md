# CONTEXT.md - Audio Konverter

> Automatisch generierte Dokumentation der Codebase

---

## Inhaltsverzeichnis

1. [Tech-Stack](#tech-stack)
2. [Ordnerstruktur](#ordnerstruktur)
3. [Datenbankschema](#datenbankschema)
4. [State Management](#state-management)
5. [API-Integration](#api-integration)
6. [Konfiguration](#konfiguration)

---

## Tech-Stack

### Frontend Framework & Build Tools

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Vue.js** | 3.4.0 | Progressives JavaScript-Framework |
| **Vite** | 5.0.0 | Modernes Build-Tool (ES-Module, Hot Reload) |
| **@vitejs/plugin-vue** | 5.0.0 | Vue 3 Plugin für Vite |

### State Management

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Pinia** | 2.1.7 | Offizielles Vue 3 State Management |

### Internationalisierung (i18n)

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Vue I18n** | 9.9.0 | Mehrsprachigkeit (Deutsch & Englisch) |

### HTTP & Networking

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Axios** | 1.6.0 | HTTP-Client für API-Anfragen |

### UI & Icons

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **FontAwesome Free** | 6.5.0 | Icon-Bibliothek |
| **jszip** | 3.10.1 | ZIP-Dateien für Batch-Downloads |

### Routing

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Vue Router** | 4.2.5 | Client-seitiges Routing |

### Development Tools

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **ESLint** | 8.57.0 | Code-Qualitätsprüfung |
| **eslint-plugin-vue** | 9.20.0 | Vue-spezifische Lint-Regeln |

### Deployment

| Technologie | Beschreibung |
|-------------|--------------|
| **PM2** | Prozessmanager für Produktion |

---

## Ordnerstruktur

```
/home/user/Audiokonverter/
│
├── .env.example                 # Umgebungsvariablen-Vorlage
├── .gitignore                   # Git-Ausschlüsse
├── README.md                    # Projekt-Dokumentation
├── INSTALLATION.md              # Installationsanleitung
├── PROJECT_SUMMARY.md           # Detaillierte Projektzusammenfassung
├── CONTEXT.md                   # Diese Datei
├── LICENSE                      # MIT-Lizenz
│
├── package.json                 # Node.js Dependencies & Scripts
├── package-lock.json            # Dependency Lock-Datei
├── vite.config.js               # Vite Build-Konfiguration
├── ecosystem.config.js          # PM2-Konfiguration
│
├── index.html                   # HTML-Einstiegspunkt
├── favicon1.svg                 # App-Icon
├── icon-192.png                 # Mobile Icon (192x192)
├── icon-512.png                 # Mobile Icon (512x512)
├── android-chrome-512x512.png   # Android Chrome Icon
│
├── public/                      # Statische Assets
│   └── favicon1.svg             # Favicon
│
└── src/                         # Quellcode
    │
    ├── main.js                  # Vue App Einstiegspunkt
    ├── App.vue                  # Root Vue-Komponente
    │
    ├── assets/
    │   └── styles/
    │       └── main.css         # Globale Styles mit CSS-Variablen
    │
    ├── components/              # Vue-Komponenten (10 Stück)
    │   ├── HeaderTitle.vue      # Seitentitel
    │   ├── NavControls.vue      # Sprach- & Theme-Toggle
    │   ├── FileUpload.vue       # Drag & Drop Upload
    │   ├── FileList.vue         # Dateiliste
    │   ├── ConversionSettings.vue   # Format- & Qualitätseinstellungen
    │   ├── GlobalActions.vue    # Clear, Download, Undo/Redo
    │   ├── StatusDisplay.vue    # Erfolgsmeldungen
    │   ├── DownloadSection.vue  # Download-UI
    │   ├── FaqSection.vue       # FAQ-Akkordeon
    │   └── ToastContainer.vue   # Toast-Benachrichtigungen
    │
    ├── stores/                  # Pinia State Management
    │   ├── audioStore.js        # Audio-Dateiverwaltung & Konvertierung
    │   └── themeStore.js        # Theme-Verwaltung (Hell/Dunkel)
    │
    ├── composables/             # Wiederverwendbare Logik
    │   └── useToast.js          # Toast-Benachrichtigungs-Composable
    │
    └── locales/                 # i18n Internationalisierung
        ├── index.js             # i18n-Konfiguration
        ├── de.js                # Deutsche Übersetzungen
        └── en.js                # Englische Übersetzungen
```

### Komponenten-Übersicht

| Komponente | Zeilen | Beschreibung |
|------------|--------|--------------|
| `HeaderTitle.vue` | 65 | Seitentitel mit Animation |
| `NavControls.vue` | 159 | Sprach- und Theme-Umschalter |
| `FileUpload.vue` | 193 | Drag & Drop Datei-Upload |
| `FileList.vue` | 383 | Anzeige der hochgeladenen Dateien |
| `ConversionSettings.vue` | 259 | Format- und Qualitätsauswahl |
| `GlobalActions.vue` | 217 | Globale Aktionen (Löschen, Download) |
| `StatusDisplay.vue` | 78 | Statusmeldungen |
| `DownloadSection.vue` | 226 | Download-Bereich |
| `FaqSection.vue` | 143 | FAQ-Bereich |
| `ToastContainer.vue` | 262 | Toast-Benachrichtigungen |

---

## Datenbankschema

### Status: Keine Datenbank

Diese Anwendung ist eine **Frontend-only Single-Page Application** ohne Backend-Datenbank-Integration.

- Keine SQL-Dateien vorhanden
- Keine Migrations-Verzeichnisse
- Keine ORM-Konfigurationen (Prisma, Sequelize, Mongoose)
- Keine Schema-Definitionen

### Datenhaltung

Die Anwendung verwaltet Daten auf folgende Weise:

| Speicherort | Datentyp | Persistenz |
|-------------|----------|------------|
| **Pinia Store (audioStore)** | Audiodateien, Konvertierungsstatus | Sitzungsbasiert (In-Memory) |
| **Pinia Store (themeStore)** | Theme-Einstellung | localStorage |
| **localStorage** | Spracheinstellung | Persistent |
| **Backend API** | Temporäre Dateien während Konvertierung | Nicht persistent |

---

## State Management

### audioStore.js

Verwaltet die Audio-Dateikonvertierung:

```javascript
// State
audioFiles: []           // Array der hochgeladenen Dateien
convertedFiles: []       // Array der konvertierten Dateien
currentFormat: 'mp3'     // Ausgewähltes Audioformat
currentQuality: 7        // Qualitätsstufe (1-10)
isConverting: false      // Konvertierung läuft
conversionProgress: {}   // Fortschritt pro Datei

// Actions
addFiles()               // Dateien hinzufügen
removeFile()             // Datei entfernen
clearAllFiles()          // Alle Dateien löschen
convertFile()            // Einzelne Datei konvertieren
convertAllFiles()        // Alle Dateien konvertieren
downloadFile()           // Einzelne Datei herunterladen
downloadAllFiles()       // Alle Dateien als ZIP herunterladen
```

### themeStore.js

Verwaltet das Erscheinungsbild:

```javascript
// State
theme: 'light' | 'dark'  // Aktuelles Theme

// Actions
toggleTheme()            // Theme umschalten
setTheme(theme)          // Theme direkt setzen
```

---

## API-Integration

### Backend-Kommunikation

| Eigenschaft | Wert |
|-------------|------|
| **Base URL** | `http://localhost:3001` (konfigurierbar) |
| **Endpoint** | `POST /audiokonverter/api/convert` |
| **Timeout** | 10 Minuten (600.000ms) |

### Request-Format

```javascript
// FormData
{
  file: File,           // Die zu konvertierende Audiodatei
  format: string,       // Zielformat (mp3, wav, flac, ogg, aac, m4a)
  quality: number       // Qualität (1-10)
}
```

### Response-Format

```javascript
// Erfolg
{
  ok: true,
  url: string,          // Download-URL
  filename: string      // Dateiname
}

// Fehler
{
  ok: false,
  error: string         // Fehlermeldung
}
```

### Unterstützte Audioformate

| Format | MIME-Type | Beschreibung |
|--------|-----------|--------------|
| MP3 | `audio/mpeg` | MPEG Audio Layer III |
| WAV | `audio/wav` | Waveform Audio |
| FLAC | `audio/flac` | Free Lossless Audio Codec |
| OGG | `audio/ogg` | Ogg Vorbis |
| AAC | `audio/aac` | Advanced Audio Coding |
| M4A | `audio/x-m4a`, `audio/mp4` | MPEG-4 Audio |

---

## Konfiguration

### Umgebungsvariablen (.env.example)

```bash
# API-Konfiguration
VITE_API_URL=http://localhost:3001

# App-Informationen
VITE_APP_NAME=Audio Konverter
VITE_APP_VERSION=2.0.0

# Upload-Limits
VITE_MAX_FILE_SIZE=314572800    # 300MB

# Unterstützte Formate
VITE_SUPPORTED_FORMATS=mp3,wav,flac,ogg,aac,m4a

# Standardeinstellungen
VITE_DEFAULT_FORMAT=mp3
VITE_DEFAULT_QUALITY=7
VITE_DEFAULT_LOCALE=de
```

### PM2 Produktionskonfiguration (ecosystem.config.js)

```javascript
{
  name: 'audiokonverter-server',
  port: 9000,
  max_memory_restart: '500M',
  autorestart: true,
  watch: false,
  cwd: '/var/www/kodinitools.com/audiokonverter'
}
```

### Vite Build-Konfiguration (vite.config.js)

| Eigenschaft | Wert |
|-------------|------|
| **Dev Server Port** | 5173 |
| **API Proxy** | `/api` → `http://localhost:3001` |
| **Files Proxy** | `/files` → `http://localhost:3001` |
| **Output Dir** | `dist/` |
| **Base Path** | `/audiokonverter/` |

### Code-Splitting Chunks

| Chunk | Inhalt |
|-------|--------|
| `vue-vendor` | Vue, Vue Router, Pinia |
| `i18n-vendor` | Vue I18n |
| `utils` | Axios, jszip |

---

## Projektstatistiken

| Metrik | Anzahl |
|--------|--------|
| Vue-Komponenten | 10 |
| Pinia Stores | 2 |
| Composables | 1 |
| Sprachdateien | 2 (de, en) |
| Konfigurationsdateien | 5 |
| Quelldateien gesamt | 18 |
| Codezeilen (Komponenten) | ~1.985 |
| Unterstützte Audioformate | 6 |

---

## Styling-System

### CSS-Variablen (Themes)

#### Light Theme
```css
--primary-color: #609198
--bg-color: #E9E9EB
--success-color: #10b981
--error-color: #ef4444
```

#### Dark Theme
```css
/* Invertierte Farben mit zugänglichem Kontrast */
```

### Design-Prinzipien

- **Mobile-First**: Responsive Design mit Media Queries
- **Animationen**: Smooth Transitions, Floating-Effekte, Slide-Ins
- **Accessibility**: Kontrastreiches Farbschema

---

## Weitere Dokumentation

- [README.md](./README.md) - Allgemeine Projektdokumentation
- [INSTALLATION.md](./INSTALLATION.md) - Installationsanleitung
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Detaillierte Projektzusammenfassung

---

*Letzte Aktualisierung: Januar 2026*
