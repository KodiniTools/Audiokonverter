# Technical Deep Dive: Audiokonverter

## Eine vollständige Lernressource zur modernen Web-Audio-Konvertierung

---

## Inhaltsverzeichnis

1. [Einführung](#1-einführung)
2. [Architektur-Übersicht](#2-architektur-übersicht)
3. [Der Technologie-Stack im Detail](#3-der-technologie-stack-im-detail)
4. [Vue 3 Composition API in der Praxis](#4-vue-3-composition-api-in-der-praxis)
5. [State Management mit Pinia](#5-state-management-mit-pinia)
6. [Das Komponentensystem](#6-das-komponentensystem)
7. [Datei-Upload und Drag & Drop](#7-datei-upload-und-drag--drop)
8. [Audio-Konvertierung und API-Integration](#8-audio-konvertierung-und-api-integration)
9. [Download-Funktionalität und Blob-Handling](#9-download-funktionalität-und-blob-handling)
10. [Internationalisierung (i18n)](#10-internationalisierung-i18n)
11. [Theming mit CSS-Variablen](#11-theming-mit-css-variablen)
12. [Das Toast-Benachrichtigungssystem](#12-das-toast-benachrichtigungssystem)
13. [Performance-Optimierung](#13-performance-optimierung)
14. [Build-Konfiguration mit Vite](#14-build-konfiguration-mit-vite)
15. [Produktions-Deployment](#15-produktions-deployment)
16. [Best Practices und Lessons Learned](#16-best-practices-und-lessons-learned)

---

## 1. Einführung

### Was ist der Audiokonverter?

Der Audiokonverter ist eine moderne Webanwendung zur Konvertierung von Audiodateien zwischen verschiedenen Formaten. Die Anwendung demonstriert Best Practices in der modernen Frontend-Entwicklung und dient als exzellentes Lernbeispiel für:

- **Vue 3 mit Composition API** - Die neueste Vue.js-Version mit dem modernen API-Ansatz
- **Pinia State Management** - Der offizielle Nachfolger von Vuex
- **Vite Build Tool** - Blitzschnelle Entwicklung mit ES-Modulen
- **Responsive Design** - Mobile-First-Ansatz ohne CSS-Framework
- **Internationalisierung** - Vollständige Zweisprachigkeit (Deutsch/Englisch)

### Unterstützte Audioformate

| Format | Beschreibung | Typische Verwendung |
|--------|--------------|---------------------|
| **MP3** | MPEG Audio Layer 3 | Universell, komprimiert |
| **WAV** | Waveform Audio | Studioqualität, unkomprimiert |
| **FLAC** | Free Lossless Audio Codec | Verlustfrei komprimiert |
| **OGG** | Ogg Vorbis | Open Source Alternative |
| **AAC** | Advanced Audio Coding | iTunes, Streaming |
| **M4A** | MPEG-4 Audio | Apple Geräte |

### Kernfunktionen

```
┌─────────────────────────────────────────────────────────────┐
│                    AUDIOKONVERTER                           │
├─────────────────────────────────────────────────────────────┤
│  ✓ Drag & Drop Upload         ✓ Batch-Verarbeitung         │
│  ✓ 6 Audioformate             ✓ Qualitätskontrolle (1-10)  │
│  ✓ Fortschrittsanzeige        ✓ Einzelne Downloads         │
│  ✓ ZIP-Batch-Download         ✓ Dark/Light Theme           │
│  ✓ Deutsch/Englisch           ✓ Responsive Design          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architektur-Übersicht

### Projektstruktur

Die Anwendung folgt einer klaren, modularen Struktur:

```
Audiokonverter/
│
├── src/                          # Quellcode
│   ├── components/               # Vue-Komponenten (10 Dateien)
│   │   ├── FileUpload.vue        # Drag & Drop Zone
│   │   ├── FileList.vue          # Dateiliste mit Status
│   │   ├── ConversionSettings.vue # Format & Qualität
│   │   ├── GlobalActions.vue     # Download-Aktionen
│   │   ├── ToastContainer.vue    # Benachrichtigungen
│   │   ├── NavControls.vue       # Sprache & Theme
│   │   ├── HeaderTitle.vue       # Animierter Titel
│   │   ├── StatusDisplay.vue     # Fertigstellungs-Status
│   │   ├── FaqSection.vue        # FAQ-Akkordeon
│   │   └── DownloadSection.vue   # Desktop-App Downloads
│   │
│   ├── stores/                   # Pinia Stores
│   │   ├── audioStore.js         # Hauptlogik (263 Zeilen)
│   │   └── themeStore.js         # Theme-Verwaltung
│   │
│   ├── composables/              # Wiederverwendbare Logik
│   │   └── useToast.js           # Toast-System
│   │
│   ├── locales/                  # Übersetzungen
│   │   ├── de.js                 # Deutsche Texte
│   │   ├── en.js                 # Englische Texte
│   │   └── index.js              # i18n-Konfiguration
│   │
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Globale Styles (~600 Zeilen)
│   │
│   ├── App.vue                   # Wurzelkomponente
│   └── main.js                   # Einstiegspunkt
│
├── public/                       # Statische Assets
├── index.html                    # HTML-Template mit SSI
├── vite.config.js                # Build-Konfiguration
├── package.json                  # Abhängigkeiten
└── ecosystem.config.js           # PM2-Konfiguration
```

### Datenfluss-Architektur

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Component  │────▶│   Store     │
│  Interaction│     │   (View)    │     │  (Pinia)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                           ┌───────────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   API       │────▶│   FFmpeg    │
                    │  (Axios)    │     │  Backend    │
                    └─────────────┘     └─────────────┘
```

**Erklärung des Datenflusses:**

1. **User Interaction**: Benutzer lädt Dateien hoch oder klickt Buttons
2. **Component**: Vue-Komponente empfängt Event und ruft Store-Action auf
3. **Store (Pinia)**: Verwaltet State und führt API-Calls aus
4. **API (Axios)**: Sendet HTTP-Requests zum Backend
5. **FFmpeg Backend**: Konvertiert die Audiodatei
6. **Reaktiver Update**: Store aktualisiert State → Komponenten re-rendern

---

## 3. Der Technologie-Stack im Detail

### 3.1 Vue 3 - Das Frontend-Framework

Vue 3 wurde als Framework gewählt wegen:

- **Composition API**: Bessere Code-Organisation und Wiederverwendbarkeit
- **Reaktivität**: Automatische UI-Updates bei Datenänderungen
- **Performance**: Kleinere Bundle-Größe, schnelleres Rendering
- **TypeScript-Ready**: Vollständige TypeScript-Unterstützung

```javascript
// Beispiel: Vue 3 Composition API Syntax
<script setup>
import { ref, computed, onMounted } from 'vue'

// Reaktive Daten
const count = ref(0)

// Computed Property
const doubled = computed(() => count.value * 2)

// Lifecycle Hook
onMounted(() => {
  console.log('Komponente wurde gemountet')
})
</script>
```

### 3.2 Pinia - State Management

Pinia ist der offizielle Nachfolger von Vuex und bietet:

- **Einfachere API**: Keine Mutations, direkter State-Zugriff
- **TypeScript-First**: Exzellente Typisierung
- **DevTools-Integration**: Vollständige Vue DevTools Unterstützung
- **Modular**: Jeder Store ist unabhängig

```javascript
// Pinia Store Grundstruktur
import { defineStore } from 'pinia'

export const useAudioStore = defineStore('audio', {
  // State - die reaktiven Daten
  state: () => ({
    files: [],
    isConverting: false
  }),

  // Getters - computed properties für den Store
  getters: {
    fileCount: (state) => state.files.length
  },

  // Actions - Methoden zur State-Manipulation
  actions: {
    addFile(file) {
      this.files.push(file)
    }
  }
})
```

### 3.3 Vite - Build Tool

Vite revolutioniert die Frontend-Entwicklung durch:

- **Instant Server Start**: Keine Bundle-Erstellung in der Entwicklung
- **Hot Module Replacement (HMR)**: Änderungen sofort sichtbar
- **Optimierter Build**: Rollup für Produktion
- **Native ES-Module**: Moderne Browser-APIs

```javascript
// vite.config.js - Beispielkonfiguration
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    target: 'es2015',
    minify: 'esbuild'
  }
})
```

### 3.4 Weitere Bibliotheken

| Bibliothek | Version | Verwendung |
|------------|---------|------------|
| **Vue I18n** | 9.9.0 | Internationalisierung |
| **Axios** | 1.6.0 | HTTP-Client |
| **JSZip** | 3.10.1 | ZIP-Erstellung im Browser |
| **FontAwesome** | 6.5.0 | Icons |

---

## 4. Vue 3 Composition API in der Praxis

### 4.1 Script Setup Syntax

Die `<script setup>`-Syntax ist die empfohlene Art, Vue 3 Komponenten zu schreiben:

```vue
<!-- Traditionelle Options API -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<!-- Moderne Composition API mit script setup -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
</script>
```

**Vorteile von `<script setup>`:**
- Weniger Boilerplate-Code
- Automatische Komponenten-Registrierung
- Bessere TypeScript-Unterstützung
- Optimierte Performance

### 4.2 Reaktivität verstehen

Vue 3 bietet zwei Hauptwege für reaktive Daten:

```javascript
import { ref, reactive, computed, watch } from 'vue'

// ref() - für primitive Werte
const count = ref(0)
console.log(count.value) // Zugriff mit .value

// reactive() - für Objekte
const state = reactive({
  files: [],
  settings: { format: 'mp3' }
})
console.log(state.files) // Direkter Zugriff

// computed() - abgeleitete Werte
const fileCount = computed(() => state.files.length)

// watch() - Reaktion auf Änderungen
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})
```

### 4.3 Praktisches Beispiel aus dem Audiokonverter

```vue
<!-- FileList.vue - Vereinfachtes Beispiel -->
<script setup>
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { useI18n } from 'vue-i18n'

// Store einbinden
const audioStore = useAudioStore()

// i18n für Übersetzungen
const { t } = useI18n()

// Computed Properties
const files = computed(() => audioStore.audioFiles)
const hasFiles = computed(() => files.value.length > 0)

// Methoden
const removeFile = (fileId) => {
  audioStore.removeFile(fileId)
}

const retryConversion = (file) => {
  audioStore.convertFile(file)
}
</script>

<template>
  <div class="file-list" v-if="hasFiles">
    <div
      v-for="file in files"
      :key="file.id"
      class="file-item"
    >
      <span class="file-name">{{ file.name }}</span>
      <span class="file-size">{{ file.formattedSize }}</span>

      <button @click="removeFile(file.id)">
        {{ t('fileList.remove') }}
      </button>
    </div>
  </div>
</template>
```

---

## 5. State Management mit Pinia

### 5.1 Der AudioStore im Detail

Der `audioStore` ist das Herzstück der Anwendung und verwaltet:

- Hochgeladene Dateien
- Konvertierte Dateien
- Konvertierungsstatus
- Einstellungen (Format, Qualität)

```javascript
// stores/audioStore.js - Vollständige Implementierung
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAudioStore = defineStore('audio', {
  // ═══════════════════════════════════════════════════════
  // STATE - Alle reaktiven Daten der Anwendung
  // ═══════════════════════════════════════════════════════
  state: () => ({
    // Array aller hochgeladenen Dateien
    audioFiles: [],

    // Array der erfolgreich konvertierten Dateien
    convertedFiles: [],

    // Flag: Läuft gerade eine Konvertierung?
    isConverting: false,

    // Aktuell gewähltes Ausgabeformat
    currentFormat: 'mp3',

    // Qualitätsstufe (1-10)
    currentQuality: 7,

    // Fortschritt pro Datei { fileId: percentage }
    conversionProgress: {}
  }),

  // ═══════════════════════════════════════════════════════
  // GETTERS - Computed Properties für den Store
  // ═══════════════════════════════════════════════════════
  getters: {
    // Gibt es hochgeladene Dateien?
    hasFiles: (state) => state.audioFiles.length > 0,

    // Gibt es konvertierte Dateien?
    hasConvertedFiles: (state) => state.convertedFiles.length > 0,

    // Anzahl der Dateien
    fileCount: (state) => state.audioFiles.length,

    // Gesamtgröße aller Dateien
    totalSize: (state) => {
      return state.audioFiles.reduce((sum, file) => sum + file.size, 0)
    },

    // Nur Dateien mit Status "completed"
    completedFiles: (state) => {
      return state.audioFiles.filter(f => f.status === 'completed')
    }
  },

  // ═══════════════════════════════════════════════════════
  // ACTIONS - Methoden zur State-Manipulation
  // ═══════════════════════════════════════════════════════
  actions: {
    // Dateien zum Upload hinzufügen
    addFiles(files) {
      const maxSize = 300 * 1024 * 1024 // 300 MB
      const supportedFormats = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a']

      for (const file of files) {
        // Validierung: Dateigröße
        if (file.size > maxSize) {
          console.error(`Datei zu groß: ${file.name}`)
          continue
        }

        // Validierung: Dateiformat
        const extension = file.name.split('.').pop().toLowerCase()
        if (!supportedFormats.includes(extension)) {
          console.error(`Format nicht unterstützt: ${extension}`)
          continue
        }

        // Datei zum Array hinzufügen
        this.audioFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          formattedSize: this.formatFileSize(file.size),
          file: file, // Original File-Objekt
          status: 'pending', // pending | converting | completed | error
          convertedUrl: null,
          convertedName: null,
          convertedSize: null,
          error: null
        })
      }
    },

    // Einzelne Datei konvertieren
    async convertFile(fileData) {
      // Status aktualisieren
      fileData.status = 'converting'
      this.conversionProgress[fileData.id] = 0

      // FormData für Upload erstellen
      const formData = new FormData()
      formData.append('file', fileData.file)
      formData.append('format', this.currentFormat)
      formData.append('quality', this.currentQuality)

      try {
        // API-Call mit Fortschrittsanzeige
        const response = await axios.post(
          '/audiokonverter/api/convert',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 600000, // 10 Minuten Timeout

            // Progress-Callback für Upload-Fortschritt
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              // Cappen bei 90% bis Server antwortet
              this.conversionProgress[fileData.id] = Math.min(percent, 90)
            }
          }
        )

        // Erfolgreiche Konvertierung
        if (response.data.ok) {
          this.conversionProgress[fileData.id] = 100
          fileData.status = 'completed'
          fileData.convertedUrl = response.data.url
          fileData.convertedName = this.generateConvertedName(
            fileData.name,
            this.currentFormat
          )

          // Konvertierte Dateigröße abrufen
          fileData.convertedSize = await this.fetchFileSize(
            response.data.url
          )

          // Zu konvertierten Dateien hinzufügen
          this.convertedFiles.push(fileData)
        }
      } catch (error) {
        fileData.status = 'error'
        fileData.error = error.message
        this.conversionProgress[fileData.id] = 0
      }
    },

    // Alle Dateien konvertieren (Batch)
    async convertAllFiles() {
      this.isConverting = true

      // Nur pending Dateien konvertieren
      const pendingFiles = this.audioFiles.filter(
        f => f.status === 'pending'
      )

      // Sequentielle Konvertierung (nicht parallel!)
      for (const file of pendingFiles) {
        await this.convertFile(file)
      }

      this.isConverting = false
    },

    // Hilfsfunktion: Dateigröße formatieren
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'

      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // Konvertierten Dateinamen generieren
    generateConvertedName(originalName, newFormat) {
      const baseName = originalName.substring(
        0,
        originalName.lastIndexOf('.')
      )
      return `${baseName}.${newFormat}`
    },

    // Dateigröße per HEAD-Request abrufen
    async fetchFileSize(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        const contentLength = response.headers.get('content-length')
        return contentLength ? parseInt(contentLength, 10) : null
      } catch {
        return null
      }
    }
  }
})
```

### 5.2 Store-Verwendung in Komponenten

```vue
<script setup>
import { useAudioStore } from '@/stores/audioStore'
import { storeToRefs } from 'pinia'

const audioStore = useAudioStore()

// Option 1: Direkter Zugriff (verliert Reaktivität bei Destrukturierung)
const files = audioStore.audioFiles // ⚠️ Nicht reaktiv!

// Option 2: storeToRefs (behält Reaktivität)
const { audioFiles, isConverting, currentFormat } = storeToRefs(audioStore)

// Actions können direkt destrukturiert werden
const { addFiles, convertAllFiles } = audioStore
</script>
```

### 5.3 Der ThemeStore

Ein einfacherer Store für das Theme-Management:

```javascript
// stores/themeStore.js
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    // Theme aus localStorage laden oder 'light' als Standard
    currentTheme: localStorage.getItem('audio-converter-theme') || 'light'
  }),

  getters: {
    isDark: (state) => state.currentTheme === 'dark'
  },

  actions: {
    toggleTheme() {
      // Theme wechseln
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'

      // Im localStorage speichern
      localStorage.setItem('audio-converter-theme', this.currentTheme)

      // DOM-Attribut setzen für CSS
      document.documentElement.setAttribute(
        'data-theme',
        this.currentTheme
      )
    },

    // Theme beim App-Start initialisieren
    initTheme() {
      document.documentElement.setAttribute(
        'data-theme',
        this.currentTheme
      )
    }
  }
})
```

---

## 6. Das Komponentensystem

### 6.1 Komponentenübersicht

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   HeaderTitle                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   NavControls                        │   │
│  │            (Sprache & Theme Toggle)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   FileUpload                         │   │
│  │              (Drag & Drop Zone)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   FileList                           │   │
│  │           (Liste aller Dateien)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               ConversionSettings                     │   │
│  │          (Format & Qualitätswahl)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 GlobalActions                        │   │
│  │         (Download & Clear Buttons)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 StatusDisplay                        │   │
│  │          (Erfolgsmeldung)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                DownloadSection                       │   │
│  │           (Desktop-App Downloads)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  FaqSection                          │   │
│  │            (FAQ-Akkordeon)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                ToastContainer                        │   │
│  │          (Benachrichtigungen)                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Komponenten-Kommunikation

Vue bietet verschiedene Wege zur Kommunikation zwischen Komponenten:

```vue
<!-- Parent → Child: Props -->
<template>
  <FileItem
    :file="fileData"
    :show-actions="true"
  />
</template>

<!-- Child → Parent: Events -->
<script setup>
const emit = defineEmits(['remove', 'retry'])

const handleRemove = () => {
  emit('remove', props.file.id)
}
</script>

<!-- Verwendung in Parent -->
<FileItem
  @remove="handleRemoveFile"
  @retry="handleRetry"
/>
```

```vue
<!-- Globaler State: Pinia Store -->
<script setup>
import { useAudioStore } from '@/stores/audioStore'

// Alle Komponenten können auf denselben Store zugreifen
const store = useAudioStore()
</script>
```

### 6.3 Bedingte Darstellung

Die Anwendung nutzt bedingte Darstellung für eine bessere UX:

```vue
<!-- App.vue - Vereinfacht -->
<template>
  <div class="app">
    <!-- Immer sichtbar -->
    <HeaderTitle />
    <NavControls />
    <FileUpload />

    <!-- Nur mit Dateien sichtbar -->
    <FileList v-if="hasFiles" />
    <ConversionSettings v-if="hasFiles" />

    <!-- Nur mit konvertierten Dateien sichtbar -->
    <GlobalActions v-if="hasConvertedFiles" />
    <StatusDisplay v-if="hasConvertedFiles" />

    <!-- Immer sichtbar -->
    <DownloadSection />
    <FaqSection />

    <!-- Benachrichtigungen (Portal) -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'

const store = useAudioStore()

const hasFiles = computed(() => store.hasFiles)
const hasConvertedFiles = computed(() => store.hasConvertedFiles)
</script>
```

---

## 7. Datei-Upload und Drag & Drop

### 7.1 Die FileUpload-Komponente

Die Drag & Drop-Funktionalität ist ein Kernfeature moderner Web-Apps:

```vue
<!-- components/FileUpload.vue -->
<template>
  <div
    class="upload-zone"
    :class="{ 'drag-over': isDragOver }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="openFilePicker"
  >
    <!-- Verstecktes Input-Element -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".mp3,.wav,.flac,.ogg,.aac,.m4a"
      @change="handleFileSelect"
      class="hidden-input"
    />

    <!-- Upload-Icon mit Animation -->
    <div class="upload-icon">
      <font-awesome-icon :icon="['fas', 'cloud-upload-alt']" />
    </div>

    <!-- Anweisungstext -->
    <p class="upload-text">
      {{ t('upload.dragDrop') }}
    </p>
    <p class="upload-hint">
      {{ t('upload.formats') }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const audioStore = useAudioStore()
const { showToast } = useToast()
const { t } = useI18n()

// Refs
const fileInput = ref(null)
const isDragOver = ref(false)

// Drag-Events mit visueller Rückmeldung
const handleDragEnter = (e) => {
  isDragOver.value = true
}

const handleDragOver = (e) => {
  // Notwendig um Drop zu erlauben
  e.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (e) => {
  // Nur wenn wir die Zone wirklich verlassen
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragOver.value = false
  }
}

const handleDrop = (e) => {
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// Click-to-Upload
const openFilePicker = () => {
  fileInput.value.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  // Input zurücksetzen für wiederholte Auswahl
  e.target.value = ''
}

// Zentrale Dateiverarbeitung
const processFiles = (files) => {
  if (files.length === 0) return

  // Dateien zum Store hinzufügen
  audioStore.addFiles(files)

  // Erfolgsmeldung
  showToast('success', t('toast.filesAdded'), {
    message: t('toast.filesAddedCount', { count: files.length })
  })
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--card-background);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 3rem;
  color: var(--primary-color);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hidden-input {
  display: none;
}
</style>
```

### 7.2 Dateivalidierung

Die Validierung erfolgt sowohl im Frontend als auch im Backend:

```javascript
// Frontend-Validierung im audioStore
const validateFile = (file) => {
  const errors = []

  // 1. Größenprüfung (max 300 MB)
  const maxSize = 300 * 1024 * 1024
  if (file.size > maxSize) {
    errors.push({
      type: 'size',
      message: `Datei zu groß: ${formatFileSize(file.size)} (Max: 300 MB)`
    })
  }

  // 2. Formatprüfung
  const supportedFormats = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a']
  const extension = file.name.split('.').pop().toLowerCase()

  if (!supportedFormats.includes(extension)) {
    errors.push({
      type: 'format',
      message: `Format nicht unterstützt: .${extension}`
    })
  }

  // 3. MIME-Type Prüfung (zusätzliche Sicherheit)
  const validMimeTypes = [
    'audio/mpeg',      // MP3
    'audio/wav',       // WAV
    'audio/x-wav',     // WAV (Alternative)
    'audio/flac',      // FLAC
    'audio/ogg',       // OGG
    'audio/aac',       // AAC
    'audio/mp4',       // M4A
    'audio/x-m4a'      // M4A (Alternative)
  ]

  if (!validMimeTypes.includes(file.type) && file.type !== '') {
    errors.push({
      type: 'mime',
      message: `Unbekannter MIME-Type: ${file.type}`
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## 8. Audio-Konvertierung und API-Integration

### 8.1 Der Konvertierungsprozess

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Server    │───▶│   FFmpeg    │───▶│  Download   │
│  (FormData) │    │  empfängt   │    │ konvertiert │    │   bereit    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
   Progress          Validierung      Konvertierung       URL zurück
   0-90%             Speicherung       im Hintergrund     100%
```

### 8.2 API-Kommunikation mit Axios

```javascript
// Konvertierung einer einzelnen Datei
async convertFile(fileData) {
  // 1. Status auf "converting" setzen
  fileData.status = 'converting'
  this.conversionProgress[fileData.id] = 0

  // 2. FormData erstellen
  const formData = new FormData()
  formData.append('file', fileData.file)
  formData.append('format', this.currentFormat)
  formData.append('quality', this.currentQuality)

  try {
    // 3. POST-Request mit Progress-Tracking
    const response = await axios.post(
      '/audiokonverter/api/convert',
      formData,
      {
        // Wichtig für Datei-Uploads
        headers: {
          'Content-Type': 'multipart/form-data'
        },

        // 10 Minuten Timeout für große Dateien
        timeout: 600000,

        // Upload-Fortschritt tracken
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            // Bei 90% stoppen bis Server antwortet
            this.conversionProgress[fileData.id] = Math.min(percent, 90)
          }
        }
      }
    )

    // 4. Erfolg verarbeiten
    if (response.data.ok) {
      this.conversionProgress[fileData.id] = 100
      fileData.status = 'completed'
      fileData.convertedUrl = response.data.url
      fileData.convertedName = this.generateConvertedName(
        fileData.name,
        this.currentFormat
      )

      // Größe der konvertierten Datei abrufen
      fileData.convertedSize = await this.fetchFileSize(response.data.url)

      // Zur Liste konvertierter Dateien hinzufügen
      this.convertedFiles.push(fileData)

      return { success: true }
    } else {
      throw new Error(response.data.error || 'Konvertierung fehlgeschlagen')
    }

  } catch (error) {
    // 5. Fehler behandeln
    fileData.status = 'error'
    fileData.error = this.parseError(error)
    this.conversionProgress[fileData.id] = 0

    return { success: false, error: fileData.error }
  }
}

// Fehler benutzerfreundlich aufbereiten
parseError(error) {
  if (error.code === 'ECONNABORTED') {
    return 'Zeitüberschreitung - die Datei ist möglicherweise zu groß'
  }
  if (error.response?.status === 413) {
    return 'Datei zu groß für den Server'
  }
  if (error.response?.status === 415) {
    return 'Dateiformat wird nicht unterstützt'
  }
  return error.message || 'Unbekannter Fehler'
}
```

### 8.3 Qualitätsmapping

Die Qualitätsstufe (1-10) wird je nach Format unterschiedlich interpretiert:

```javascript
// Backend-seitige Qualitätsmappings
const qualityMappings = {
  mp3: {
    // Bitrate in kbps
    1: 64,
    2: 80,
    3: 96,
    4: 112,
    5: 128,
    6: 160,
    7: 192,
    8: 224,
    9: 256,
    10: 320
  },

  wav: {
    // Bit-Tiefe
    1: 8,
    2: 8,
    3: 16,
    4: 16,
    5: 16,
    6: 16,
    7: 24,
    8: 24,
    9: 32,
    10: 32
  },

  flac: {
    // Kompressionsstufe (0-8, invertiert für UX)
    1: 8,  // Höchste Kompression
    5: 5,  // Standard
    10: 0  // Keine Kompression
  },

  ogg: {
    // Vorbis Qualität (Q-1 bis Q10)
    1: -1,
    5: 5,
    10: 10
  },

  aac: {
    // Ähnlich wie MP3
    1: 64,
    5: 128,
    10: 320
  }
}
```

---

## 9. Download-Funktionalität und Blob-Handling

### 9.1 Einzelner Datei-Download

```javascript
// Einzelne Datei herunterladen
async downloadFile(fileData) {
  try {
    // 1. Datei als Blob abrufen
    const response = await fetch(fileData.convertedUrl)

    if (!response.ok) {
      throw new Error('Download fehlgeschlagen')
    }

    const blob = await response.blob()

    // 2. Temporäre URL erstellen
    const url = window.URL.createObjectURL(blob)

    // 3. Versteckten Download-Link erstellen
    const link = document.createElement('a')
    link.href = url
    link.download = fileData.convertedName

    // 4. Link klicken und aufräumen
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 5. Blob-URL freigeben (Memory Management!)
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)

  } catch (error) {
    // Fallback: Direkter Link
    window.open(fileData.convertedUrl, '_blank')
  }
}
```

### 9.2 Batch-Download (Separate Dateien)

```javascript
// Alle Dateien einzeln herunterladen
async downloadAllFiles() {
  const completedFiles = this.audioFiles.filter(
    f => f.status === 'completed'
  )

  for (let i = 0; i < completedFiles.length; i++) {
    await this.downloadFile(completedFiles[i])

    // Verzögerung zwischen Downloads (Browser-Limit umgehen)
    if (i < completedFiles.length - 1) {
      await this.delay(300 + Math.random() * 200)
    }
  }
}

// Hilfsfunktion für Verzögerung
delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### 9.3 ZIP-Download mit JSZip

```javascript
import JSZip from 'jszip'

async downloadAsZip() {
  const completedFiles = this.audioFiles.filter(
    f => f.status === 'completed'
  )

  if (completedFiles.length === 0) return

  // 1. Neue ZIP-Instanz erstellen
  const zip = new JSZip()

  // 2. Alle Dateien zur ZIP hinzufügen
  for (const file of completedFiles) {
    try {
      const response = await fetch(file.convertedUrl)
      const blob = await response.blob()

      // Datei zur ZIP hinzufügen
      zip.file(file.convertedName, blob)
    } catch (error) {
      console.error(`Fehler beim Hinzufügen: ${file.convertedName}`)
    }
  }

  // 3. ZIP generieren
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  // 4. ZIP herunterladen
  const url = window.URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'converted-audio-files.zip'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}
```

### 9.4 Dateigrößen-Anzeige

```vue
<!-- FileList.vue - Größenvergleich -->
<template>
  <div class="file-sizes">
    <span class="original-size">
      {{ file.formattedSize }}
    </span>

    <span class="arrow" v-if="file.convertedSize">
      →
    </span>

    <span
      class="converted-size"
      v-if="file.convertedSize"
      :class="sizeClass"
    >
      {{ formatFileSize(file.convertedSize) }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['file'])

// Farbcodierung: Grün wenn kleiner, Rot wenn größer
const sizeClass = computed(() => {
  if (!props.file.convertedSize) return ''

  const ratio = props.file.convertedSize / props.file.size

  if (ratio < 0.9) return 'size-smaller'  // >10% kleiner
  if (ratio > 1.1) return 'size-larger'   // >10% größer
  return 'size-similar'                    // Ähnlich
})
</script>

<style scoped>
.size-smaller { color: var(--success-color); }
.size-larger { color: var(--error-color); }
.size-similar { color: var(--text-muted); }
</style>
```

---

## 10. Internationalisierung (i18n)

### 10.1 Vue I18n Konfiguration

```javascript
// src/locales/index.js
import { createI18n } from 'vue-i18n'
import de from './de.js'
import en from './en.js'

// Browsersprache erkennen
const getBrowserLocale = () => {
  const navigatorLocale = navigator.language || navigator.userLanguage
  const locale = navigatorLocale.split('-')[0]
  return ['de', 'en'].includes(locale) ? locale : 'de'
}

// Gespeicherte Sprache oder Browsersprache
const getInitialLocale = () => {
  const saved = localStorage.getItem('audio-converter-locale')
  return saved || getBrowserLocale()
}

// i18n-Instanz erstellen
export const i18n = createI18n({
  legacy: false,           // Composition API Modus
  globalInjection: true,   // $t global verfügbar
  locale: getInitialLocale(),
  fallbackLocale: 'en',    // Fallback wenn Übersetzung fehlt
  messages: { de, en }
})

// Sprache wechseln
export const setLocale = (locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('audio-converter-locale', locale)
  document.documentElement.setAttribute('lang', locale)
}
```

### 10.2 Übersetzungsdateien

```javascript
// src/locales/de.js
export default {
  app: {
    title: 'Audio Konverter',
    subtitle: 'Konvertiere deine Audiodateien einfach und schnell'
  },

  nav: {
    language: 'Sprache',
    theme: 'Design',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus'
  },

  upload: {
    dragDrop: 'Dateien hierher ziehen oder klicken zum Auswählen',
    formats: 'Unterstützt: MP3, WAV, FLAC, OGG, AAC, M4A',
    maxSize: 'Maximale Dateigröße: 300 MB'
  },

  conversion: {
    format: 'Ausgabeformat',
    quality: 'Qualität',
    qualityLevels: {
      1: 'Niedrig',
      5: 'Mittel',
      7: 'Hoch',
      10: 'Maximum'
    },
    convert: 'Konvertieren',
    converting: 'Konvertiere...'
  },

  fileList: {
    title: 'Dateien',
    status: {
      pending: 'Wartend',
      converting: 'Konvertiere...',
      completed: 'Fertig',
      error: 'Fehler'
    },
    remove: 'Entfernen',
    retry: 'Erneut versuchen'
  },

  actions: {
    downloadAll: 'Alle herunterladen',
    downloadZip: 'Als ZIP herunterladen',
    clearAll: 'Alle entfernen',
    clearConfirm: 'Wirklich alle Dateien entfernen?'
  },

  toast: {
    success: 'Erfolg',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Info',
    filesAdded: 'Dateien hinzugefügt',
    filesAddedCount: '{count} Datei(en) hinzugefügt',
    conversionComplete: 'Konvertierung abgeschlossen',
    downloadStarted: 'Download gestartet'
  },

  errors: {
    fileTooLarge: 'Datei zu groß (max. 300 MB)',
    formatNotSupported: 'Format nicht unterstützt',
    conversionFailed: 'Konvertierung fehlgeschlagen',
    networkError: 'Netzwerkfehler'
  },

  faq: {
    title: 'Häufige Fragen',
    items: [
      {
        question: 'Welche Formate werden unterstützt?',
        answer: 'Der Audio Konverter unterstützt MP3, WAV, FLAC, OGG, AAC und M4A.'
      },
      {
        question: 'Wie groß dürfen die Dateien sein?',
        answer: 'Die maximale Dateigröße beträgt 300 MB pro Datei.'
      },
      {
        question: 'Werden meine Dateien gespeichert?',
        answer: 'Nein, alle Dateien werden nach der Konvertierung automatisch gelöscht.'
      }
    ]
  }
}
```

```javascript
// src/locales/en.js
export default {
  app: {
    title: 'Audio Converter',
    subtitle: 'Convert your audio files easily and quickly'
  },

  nav: {
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode'
  },

  upload: {
    dragDrop: 'Drag files here or click to select',
    formats: 'Supported: MP3, WAV, FLAC, OGG, AAC, M4A',
    maxSize: 'Maximum file size: 300 MB'
  },

  // ... weitere Übersetzungen
}
```

### 10.3 Verwendung in Komponenten

```vue
<template>
  <div>
    <!-- Einfache Übersetzung -->
    <h1>{{ t('app.title') }}</h1>

    <!-- Mit Variablen -->
    <p>{{ t('toast.filesAddedCount', { count: fileCount }) }}</p>

    <!-- Pluralisierung -->
    <p>{{ t('fileList.count', fileCount) }}</p>

    <!-- In Attributen -->
    <button :title="t('actions.downloadAll')">
      <font-awesome-icon icon="download" />
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Sprache wechseln
const switchLanguage = (lang) => {
  locale.value = lang
}
</script>
```

### 10.4 Sprachwechsel-Komponente

```vue
<!-- NavControls.vue - Sprachauswahl -->
<template>
  <div class="language-toggle">
    <button
      @click="switchLanguage('de')"
      :class="{ active: currentLocale === 'de' }"
    >
      DE
    </button>
    <button
      @click="switchLanguage('en')"
      :class="{ active: currentLocale === 'en' }"
    >
      EN
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/locales'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const switchLanguage = (lang) => {
  setLocale(lang)
}
</script>
```

---

## 11. Theming mit CSS-Variablen

### 11.1 Das CSS-Variablen-System

CSS Custom Properties (Variablen) ermöglichen dynamisches Theming ohne JavaScript:

```css
/* src/assets/styles/main.css */

/* ═══════════════════════════════════════════════════════════
   LIGHT THEME (Standard)
   ═══════════════════════════════════════════════════════════ */
:root {
  /* Hauptfarben */
  --primary-color: #609198;
  --primary-dark: #4a7178;
  --primary-light: rgba(96, 145, 152, 0.1);

  /* Hintergrund */
  --background-color: #E9E9EB;
  --card-background: #ffffff;
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Text */
  --text-color: #1a1a2e;
  --text-muted: #6b7280;
  --text-light: #9ca3af;

  /* Statusfarben */
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;

  /* Borders */
  --border-color: #e5e7eb;
  --border-radius: 12px;

  /* Übergänge */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
}

/* ═══════════════════════════════════════════════════════════
   DARK THEME
   ═══════════════════════════════════════════════════════════ */
[data-theme="dark"] {
  --primary-color: #7fb8c0;
  --primary-dark: #609198;
  --primary-light: rgba(127, 184, 192, 0.15);

  --background-color: #1a1a2e;
  --card-background: #252540;
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

  --text-color: #f3f4f6;
  --text-muted: #9ca3af;
  --text-light: #6b7280;

  --border-color: #374151;
}
```

### 11.2 Verwendung in Komponenten

```css
/* Komponenten-Styles mit CSS-Variablen */
.card {
  background: var(--card-background);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  transition: all var(--transition-normal);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.button-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.button-primary:hover {
  background: var(--primary-dark);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.status-badge.pending {
  background: var(--warning-color);
  color: white;
}

.status-badge.completed {
  background: var(--success-color);
  color: white;
}

.status-badge.error {
  background: var(--error-color);
  color: white;
}
```

### 11.3 Theme-Toggle Implementierung

```javascript
// stores/themeStore.js
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: localStorage.getItem('audio-converter-theme') || 'light'
  }),

  getters: {
    isDark: (state) => state.currentTheme === 'dark'
  },

  actions: {
    toggleTheme() {
      this.currentTheme = this.isDark ? 'light' : 'dark'
      this.applyTheme()
    },

    applyTheme() {
      // 1. DOM-Attribut setzen (aktiviert CSS-Variablen)
      document.documentElement.setAttribute('data-theme', this.currentTheme)

      // 2. Im localStorage speichern
      localStorage.setItem('audio-converter-theme', this.currentTheme)

      // 3. Meta-Tag für Mobilgeräte aktualisieren
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.content = this.isDark ? '#1a1a2e' : '#E9E9EB'
      }
    },

    initTheme() {
      // System-Präferenz berücksichtigen wenn keine gespeichert
      if (!localStorage.getItem('audio-converter-theme')) {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
        this.currentTheme = prefersDark ? 'dark' : 'light'
      }
      this.applyTheme()
    }
  }
})
```

### 11.4 System-Präferenz erkennen

```javascript
// Optional: Auf System-Änderungen reagieren
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

mediaQuery.addEventListener('change', (e) => {
  const themeStore = useThemeStore()

  // Nur wenn keine manuelle Auswahl getroffen wurde
  if (!localStorage.getItem('audio-converter-theme')) {
    themeStore.currentTheme = e.matches ? 'dark' : 'light'
    themeStore.applyTheme()
  }
})
```

---

## 12. Das Toast-Benachrichtigungssystem

### 12.1 Der useToast Composable

Composables sind wiederverwendbare Logik-Einheiten in Vue 3:

```javascript
// src/composables/useToast.js
import { ref } from 'vue'

// Globaler State (außerhalb der Funktion = Singleton)
const toasts = ref([])
let toastId = 0

export function useToast() {
  /**
   * Toast-Benachrichtigung anzeigen
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} title - Überschrift
   * @param {object} options - Zusätzliche Optionen
   */
  const showToast = (type, title, options = {}) => {
    const id = ++toastId

    const toast = {
      id,
      type,
      title,
      message: options.message || '',
      duration: options.duration || 5000,
      dismissible: options.dismissible !== false,
      timestamp: Date.now()
    }

    // Toast hinzufügen
    toasts.value.push(toast)

    // Auto-Remove nach Duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }

    return id
  }

  /**
   * Toast entfernen
   */
  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * Bestätigungs-Toast mit Promise
   */
  const showConfirmToast = (type, title, message) => {
    return new Promise((resolve) => {
      const id = ++toastId

      const toast = {
        id,
        type,
        title,
        message,
        isConfirm: true,
        onConfirm: () => {
          removeToast(id)
          resolve(true)
        },
        onCancel: () => {
          removeToast(id)
          resolve(false)
        }
      }

      toasts.value.push(toast)
    })
  }

  /**
   * Alle Toasts entfernen
   */
  const clearAllToasts = () => {
    toasts.value = []
  }

  return {
    toasts,        // Reaktives Array für die Anzeige
    showToast,
    removeToast,
    showConfirmToast,
    clearAllToasts
  }
}
```

### 12.2 ToastContainer Komponente

```vue
<!-- components/ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`]"
        >
          <!-- Icon -->
          <div class="toast-icon">
            <font-awesome-icon :icon="getIcon(toast.type)" />
          </div>

          <!-- Inhalt -->
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message" v-if="toast.message">
              {{ toast.message }}
            </div>

            <!-- Bestätigungs-Buttons -->
            <div class="toast-actions" v-if="toast.isConfirm">
              <button
                class="btn-confirm"
                @click="toast.onConfirm"
              >
                {{ t('common.yes') }}
              </button>
              <button
                class="btn-cancel"
                @click="toast.onCancel"
              >
                {{ t('common.no') }}
              </button>
            </div>
          </div>

          <!-- Schließen-Button -->
          <button
            v-if="toast.dismissible && !toast.isConfirm"
            class="toast-close"
            @click="removeToast(toast.id)"
          >
            <font-awesome-icon icon="times" />
          </button>

          <!-- Progress-Bar -->
          <div
            v-if="!toast.isConfirm"
            class="toast-progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const { toasts, removeToast } = useToast()
const { t } = useI18n()

const getIcon = (type) => {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  }
  return icons[type] || 'info-circle'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.toast-success { border-left: 4px solid var(--success-color); }
.toast-error { border-left: 4px solid var(--error-color); }
.toast-warning { border-left: 4px solid var(--warning-color); }
.toast-info { border-left: 4px solid var(--info-color); }

.toast-icon {
  font-size: 1.25rem;
}

.toast-success .toast-icon { color: var(--success-color); }
.toast-error .toast-icon { color: var(--error-color); }
.toast-warning .toast-icon { color: var(--warning-color); }
.toast-info .toast-icon { color: var(--info-color); }

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: var(--text-color);
}

.toast-message {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  transition: color var(--transition-fast);
}

.toast-close:hover {
  color: var(--text-color);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: progress linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Übergangs-Animationen */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
```

### 12.3 Verwendung im Code

```javascript
// In beliebiger Komponente oder Store
import { useToast } from '@/composables/useToast'

const { showToast, showConfirmToast } = useToast()

// Einfache Benachrichtigung
showToast('success', 'Konvertierung abgeschlossen', {
  message: '5 Dateien erfolgreich konvertiert'
})

// Fehler-Benachrichtigung
showToast('error', 'Fehler', {
  message: 'Die Datei konnte nicht konvertiert werden',
  duration: 8000 // Länger anzeigen
})

// Bestätigungsdialog
const confirmed = await showConfirmToast(
  'warning',
  'Dateien löschen?',
  'Diese Aktion kann nicht rückgängig gemacht werden.'
)

if (confirmed) {
  // Löschen durchführen
}
```

---

## 13. Performance-Optimierung

### 13.1 Code-Splitting

Vite unterstützt automatisches und manuelles Code-Splitting:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manuelle Chunk-Konfiguration
        manualChunks: {
          // Vue-Kern in separatem Chunk
          'vue-vendor': ['vue', 'pinia'],

          // i18n separat
          'i18n-vendor': ['vue-i18n'],

          // Utilities
          'utils': ['axios', 'jszip']
        }
      }
    }
  }
})
```

**Ergebnis:** Mehrere kleinere Dateien statt einer großen, besseres Caching.

### 13.2 Lazy Loading von Komponenten

```javascript
// Dynamischer Import für selten genutzte Komponenten
import { defineAsyncComponent } from 'vue'

const FaqSection = defineAsyncComponent(() =>
  import('./components/FaqSection.vue')
)

const DownloadSection = defineAsyncComponent({
  loader: () => import('./components/DownloadSection.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  errorComponent: ErrorComponent
})
```

### 13.3 Virtual Scrolling für große Listen

Bei sehr vielen Dateien kann Virtual Scrolling eingesetzt werden:

```vue
<!-- Konzept (nicht im aktuellen Projekt implementiert) -->
<template>
  <RecycleScroller
    :items="files"
    :item-size="60"
    key-field="id"
    v-slot="{ item }"
  >
    <FileItem :file="item" />
  </RecycleScroller>
</template>
```

### 13.4 Memo und Computed Caching

```javascript
// Vue cached computed properties automatisch
const sortedFiles = computed(() => {
  // Wird nur neu berechnet wenn sich audioFiles ändert
  return [...audioStore.audioFiles].sort((a, b) => {
    return a.name.localeCompare(b.name)
  })
})

// Bei teuren Operationen: shallowRef verwenden
import { shallowRef } from 'vue'

const largeData = shallowRef({
  // Große verschachtelte Objekte
  // Nur Top-Level Änderungen tracken
})
```

### 13.5 Asset-Optimierung

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // Assets < 4KB werden inline als Base64
    assetsInlineLimit: 4096,

    // CSS in separaten Dateien
    cssCodeSplit: true,

    // Moderne Browser-Targets
    target: 'es2015',

    // Schneller Minifier
    minify: 'esbuild'
  }
})
```

### 13.6 Barrierefreiheit und Performance

```css
/* Animationen für Nutzer deaktivieren die es wünschen */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 14. Build-Konfiguration mit Vite

### 14.1 Vollständige Vite-Konfiguration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // ═══════════════════════════════════════════════════════
  // PLUGINS
  // ═══════════════════════════════════════════════════════
  plugins: [
    vue()  // Vue 3 Single File Components
  ],

  // ═══════════════════════════════════════════════════════
  // PFAD-ALIASE
  // ═══════════════════════════════════════════════════════
  resolve: {
    alias: {
      // @ = src/ Verzeichnis
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // ═══════════════════════════════════════════════════════
  // ENTWICKLUNGS-SERVER
  // ═══════════════════════════════════════════════════════
  server: {
    port: 5173,
    strictPort: false,  // Fallback auf anderen Port wenn belegt
    open: false,        // Browser nicht automatisch öffnen

    // API-Proxy für lokale Entwicklung
    proxy: {
      '/audiokonverter/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audiokonverter/, '')
      },
      '/audiokonverter/files': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audiokonverter/, '')
      }
    }
  },

  // ═══════════════════════════════════════════════════════
  // PRODUKTIONS-BUILD
  // ═══════════════════════════════════════════════════════
  build: {
    // Subpath-Deployment
    base: '/audiokonverter/',

    // Output-Verzeichnis
    outDir: 'dist',

    // Browser-Unterstützung
    target: 'es2015',

    // Schneller Minifier
    minify: 'esbuild',

    // Source Maps in Produktion (für Debugging)
    sourcemap: false,

    // Chunk-Größen-Warnung
    chunkSizeWarningLimit: 500,

    // Rollup-Optionen
    rollupOptions: {
      output: {
        // Dateinamen-Pattern
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // CSS-Dateien
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          // Bilder
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'assets/img/[name]-[hash][extname]'
          }
          // Fonts
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          // Andere Assets
          return 'assets/[name]-[hash][extname]'
        },

        // Manuelle Chunks
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'i18n-vendor': ['vue-i18n'],
          'utils': ['axios']
        }
      }
    }
  },

  // ═══════════════════════════════════════════════════════
  // PREVIEW-SERVER (für lokale Prod-Tests)
  // ═══════════════════════════════════════════════════════
  preview: {
    port: 4173,
    strictPort: false
  }
})
```

### 14.2 Umgebungsvariablen

```bash
# .env.example
# ═══════════════════════════════════════════════════════
# ANWENDUNGS-KONFIGURATION
# ═══════════════════════════════════════════════════════

# API-Endpunkt
VITE_API_URL=http://localhost:3001

# App-Metadaten
VITE_APP_NAME=Audio Konverter
VITE_APP_VERSION=2.0.0

# ═══════════════════════════════════════════════════════
# DATEI-EINSTELLUNGEN
# ═══════════════════════════════════════════════════════

# Maximale Dateigröße in Bytes (300 MB)
VITE_MAX_FILE_SIZE=314572800

# Unterstützte Formate
VITE_SUPPORTED_FORMATS=mp3,wav,flac,ogg,aac,m4a

# ═══════════════════════════════════════════════════════
# STANDARD-EINSTELLUNGEN
# ═══════════════════════════════════════════════════════

VITE_DEFAULT_FORMAT=mp3
VITE_DEFAULT_QUALITY=7
VITE_DEFAULT_LOCALE=de
```

```javascript
// Verwendung im Code
const maxFileSize = import.meta.env.VITE_MAX_FILE_SIZE
const appName = import.meta.env.VITE_APP_NAME

// TypeScript-Typisierung (optional)
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_MAX_FILE_SIZE: string
}
```

---

## 15. Produktions-Deployment

### 15.1 PM2-Konfiguration

PM2 ist ein Prozess-Manager für Node.js-Anwendungen:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      // ═══════════════════════════════════════════════════
      // ANWENDUNGS-IDENTIFIKATION
      // ═══════════════════════════════════════════════════
      name: 'audiokonverter-server',
      version: '2.0.0',

      // ═══════════════════════════════════════════════════
      // SKRIPT & VERZEICHNISSE
      // ═══════════════════════════════════════════════════
      script: '/var/www/kodinitools.com/_backend_common/server.js',
      cwd: '/var/www/kodinitools.com/audiokonverter',

      // ═══════════════════════════════════════════════════
      // UMGEBUNG
      // ═══════════════════════════════════════════════════
      env: {
        NODE_ENV: 'production',
        PORT: 9000
      },

      // ═══════════════════════════════════════════════════
      // PERFORMANCE & STABILITÄT
      // ═══════════════════════════════════════════════════
      instances: 1,              // Single Instance
      exec_mode: 'fork',         // Fork-Modus
      max_memory_restart: '500M', // Neustart bei 500MB RAM

      // ═══════════════════════════════════════════════════
      // AUTO-RESTART
      // ═══════════════════════════════════════════════════
      autorestart: true,
      watch: false,              // Kein File-Watching in Prod
      max_restarts: 10,
      restart_delay: 4000,       // 4s zwischen Neustarts

      // ═══════════════════════════════════════════════════
      // LOGGING
      // ═══════════════════════════════════════════════════
      error_file: '/var/log/pm2/audiokonverter-error.log',
      out_file: '/var/log/pm2/audiokonverter-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
```

### 15.2 Deployment-Workflow

```bash
#!/bin/bash
# deploy.sh - Deployment-Skript

# 1. In Projektverzeichnis wechseln
cd /var/www/kodinitools.com/audiokonverter

# 2. Neuesten Code holen
git pull origin main

# 3. Dependencies installieren
npm ci --production

# 4. Frontend bauen
npm run build

# 5. PM2 neu starten
pm2 restart audiokonverter-server

# 6. Status prüfen
pm2 status

echo "Deployment abgeschlossen!"
```

### 15.3 Nginx-Konfiguration

```nginx
# /etc/nginx/sites-available/kodinitools.com

server {
    listen 443 ssl http2;
    server_name kodinitools.com;

    # SSL-Konfiguration
    ssl_certificate /etc/letsencrypt/live/kodinitools.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kodinitools.com/privkey.pem;

    # Audiokonverter Frontend (statische Dateien)
    location /audiokonverter/ {
        alias /var/www/kodinitools.com/audiokonverter/dist/;
        try_files $uri $uri/ /audiokonverter/index.html;

        # Caching für statische Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Audiokonverter API (Proxy zu Node.js)
    location /audiokonverter/api/ {
        proxy_pass http://localhost:9000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # Erhöhte Limits für Datei-Uploads
        client_max_body_size 300M;
        proxy_read_timeout 600s;
    }

    # Konvertierte Dateien
    location /audiokonverter/files/ {
        proxy_pass http://localhost:9000/files/;
        proxy_http_version 1.1;
    }
}
```

### 15.4 Build-Output-Struktur

```
dist/
├── index.html                          # Einstiegspunkt
├── assets/
│   ├── js/
│   │   ├── index-a1b2c3d4.js          # Haupt-Bundle
│   │   ├── vue-vendor-e5f6g7h8.js     # Vue + Pinia
│   │   ├── i18n-vendor-i9j0k1l2.js    # Vue I18n
│   │   └── utils-m3n4o5p6.js          # Axios, JSZip
│   ├── css/
│   │   └── index-q7r8s9t0.css         # Styles
│   └── img/
│       └── favicon-u1v2w3x4.png       # Bilder
└── favicon.ico
```

---

## 16. Best Practices und Lessons Learned

### 16.1 Vue 3 Best Practices

```javascript
// ✅ DO: Composition API mit script setup
<script setup>
import { ref, computed } from 'vue'
const count = ref(0)
</script>

// ❌ DON'T: Options API in Vue 3 Projekten mischen
<script>
export default {
  data() { return { count: 0 } }
}
</script>
```

```javascript
// ✅ DO: storeToRefs für reaktive Store-Werte
const { files, isConverting } = storeToRefs(audioStore)

// ❌ DON'T: Direkte Destrukturierung verliert Reaktivität
const { files } = audioStore // Nicht reaktiv!
```

```javascript
// ✅ DO: Computed für abgeleitete Werte
const sortedFiles = computed(() =>
  [...files.value].sort((a, b) => a.name.localeCompare(b.name))
)

// ❌ DON'T: Sortierung in Template
// <div v-for="file in files.sort(...)">
```

### 16.2 State Management Best Practices

```javascript
// ✅ DO: Actions für komplexe Operationen
actions: {
  async uploadAndConvert(file) {
    await this.uploadFile(file)
    await this.convertFile(file)
  }
}

// ❌ DON'T: Komplexe Logik in Komponenten
const handleUpload = async (file) => {
  store.files.push(file) // Direkte Mutation
  await axios.post(...)   // API-Call in Komponente
}
```

```javascript
// ✅ DO: Getters für berechnete State-Werte
getters: {
  completedFiles: (state) => state.files.filter(f => f.status === 'completed'),
  completedCount: (state) => state.completedFiles.length
}

// ❌ DON'T: Filter-Logik in jeder Komponente wiederholen
```

### 16.3 CSS Best Practices

```css
/* ✅ DO: CSS-Variablen für Konsistenz */
.button {
  background: var(--primary-color);
  border-radius: var(--border-radius);
}

/* ❌ DON'T: Hardcoded Werte überall */
.button {
  background: #609198;
  border-radius: 12px;
}
```

```css
/* ✅ DO: Mobile-First Responsive Design */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* ❌ DON'T: Desktop-First */
.container {
  padding: 2rem;
}

@media (max-width: 767px) {
  .container {
    padding: 1rem;
  }
}
```

### 16.4 Performance Best Practices

```javascript
// ✅ DO: Lazy Loading für große Komponenten
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// ✅ DO: v-once für statische Inhalte
<template>
  <footer v-once>{{ copyrightText }}</footer>
</template>

// ✅ DO: v-memo für Listen-Optimierung
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.updated]">
  {{ item.name }}
</div>
```

### 16.5 Sicherheits-Best-Practices

```javascript
// ✅ DO: Input validieren
const validateFile = (file) => {
  // Größe prüfen
  if (file.size > MAX_SIZE) return false

  // Format prüfen (nicht nur Extension!)
  const validTypes = ['audio/mpeg', 'audio/wav', ...]
  if (!validTypes.includes(file.type)) return false

  return true
}

// ✅ DO: XSS-Prävention (Vue macht das automatisch)
<template>
  <div>{{ userInput }}</div> <!-- Automatisch escaped -->
</template>

// ❌ DON'T: v-html mit Benutzer-Input
<div v-html="userInput"></div> <!-- XSS-Gefahr! -->
```

### 16.6 Zusammenfassung der Architektur-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| **Vue 3 + Composition API** | Bessere Code-Organisation, TypeScript-ready |
| **Pinia statt Vuex** | Einfachere API, kein Boilerplate |
| **Vite statt Webpack** | 10x schnellerer Dev-Server, native ES-Module |
| **CSS-Variablen statt Tailwind** | Leichtgewichtig, kein Build-Overhead |
| **JSZip im Browser** | Keine Server-Last für ZIP-Erstellung |
| **i18n mit Vue I18n** | Offizielle Lösung, exzellente Integration |
| **Composables für Logik** | Wiederverwendbar, testbar, modular |

---

## Fazit

Der Audiokonverter demonstriert, wie moderne Web-Entwicklung aussehen kann:

1. **Klare Architektur**: Komponenten, Stores, Composables sind sauber getrennt
2. **Moderne Tools**: Vue 3, Pinia, Vite bilden einen leistungsfähigen Stack
3. **User Experience**: Drag & Drop, Fortschrittsanzeigen, Toasts
4. **Internationalisierung**: Vollständige Zweisprachigkeit von Anfang an
5. **Performance**: Code-Splitting, optimierte Builds, effizientes Caching
6. **Wartbarkeit**: Klare Strukturen, dokumentierter Code

Diese Anwendung eignet sich hervorragend als Lernprojekt, um moderne Frontend-Entwicklung mit Vue 3 zu verstehen und die Konzepte auf eigene Projekte anzuwenden.

---

## Weiterführende Ressourcen

- [Vue 3 Dokumentation](https://vuejs.org/)
- [Pinia Dokumentation](https://pinia.vuejs.org/)
- [Vite Dokumentation](https://vitejs.dev/)
- [Vue I18n Dokumentation](https://vue-i18n.intlify.dev/)
- [MDN Web Docs - Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [JSZip Dokumentation](https://stuk.github.io/jszip/)

---

*Dieser technische Deep Dive wurde als Lernressource für Entwickler erstellt, die moderne Web-Anwendungen mit Vue 3 entwickeln möchten.*
