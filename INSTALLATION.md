# 🚀 Audio Konverter Vue 3 - Schnellstart-Anleitung

## 📋 Übersicht

Diese moderne Vue 3-Anwendung ersetzt die bisherige JavaScript-Lösung und bietet:

✅ **Vue 3 Composition API** - Moderne Reaktivität
✅ **Pinia State Management** - Zentraler App-State
✅ **Vue I18n** - Mehrsprachigkeit (DE/EN)
✅ **Vite** - Blitzschnelles Build-Tool
✅ **TypeScript-Ready** - Vorbereitet für TS
✅ **Dark Mode** - Theme-Wechsel
✅ **Responsive Design** - Mobile-First

## 🔧 Installation

### Schritt 1: Dependencies installieren

```bash
cd audio-converter-vue
npm install
```

### Schritt 2: Environment konfigurieren (optional)

```bash
cp .env.example .env
```

Passe die Werte in `.env` nach Bedarf an.

### Schritt 3: Development Server starten

```bash
npm run dev
```

Die App läuft nun auf: **http://localhost:5173**

### Schritt 4: Backend starten

Das Backend muss parallel laufen. In einem neuen Terminal:

```bash
cd ../backend  # Dein Backend-Verzeichnis
npm start
```

Backend läuft auf: **http://localhost:3001**

## 📁 Projekt-Struktur

```
audio-converter-vue/
│
├── src/
│   ├── components/           # Vue-Komponenten
│   │   ├── HeaderNav.vue
│   │   ├── FileUpload.vue
│   │   ├── FileList.vue
│   │   ├── ConversionSettings.vue
│   │   └── ...
│   │
│   ├── stores/              # Pinia Stores
│   │   ├── audioStore.js    # Audio-Verwaltung
│   │   └── themeStore.js    # Theme-Verwaltung
│   │
│   ├── locales/             # i18n Übersetzungen
│   │   ├── de.js            # Deutsch
│   │   ├── en.js            # Englisch
│   │   └── index.js         # i18n Config
│   │
│   ├── composables/         # Wiederverwendbare Logik
│   │   └── useToast.js
│   │
│   ├── assets/              # Statische Assets
│   │   └── styles/
│   │       └── main.css
│   │
│   ├── App.vue              # Hauptkomponente
│   └── main.js              # Entry Point
│
├── public/                  # Öffentliche Assets
│   └── favicon.svg
│
├── index.html               # HTML Template
├── vite.config.js           # Vite Config
├── package.json             # Dependencies
└── README.md                # Dokumentation
```

## 🎯 Hauptkomponenten

### 1. **AudioStore** (`stores/audioStore.js`)
Verwaltet den gesamten Audio-State:
- Datei-Upload
- Konvertierungs-Status
- Format & Qualität
- History (Undo/Redo)
- Download-Funktionen

### 2. **FileUpload** (`components/FileUpload.vue`)
- Drag & Drop Interface
- Datei-Validierung
- Multi-File-Upload
- Unterstützte Formate: MP3, WAV, FLAC, OGG, AAC, M4A

### 3. **ConversionSettings** (`components/ConversionSettings.vue`)
- Format-Auswahl
- Qualitäts-Slider (1-10)
- Live-Vorschau der Bitrate
- Batch-Konvertierung

### 4. **i18n System** (`locales/`)
Mehrsprachigkeit:
- Deutsch (Standard)
- Englisch
- Einfach erweiterbar

## 🌐 API-Integration

### Backend-Endpunkte

**POST /api/convert**
```javascript
// Request
FormData {
  file: File,
  format: 'mp3',
  quality: '7'
}

// Response
{
  "ok": true,
  "output": "/files/converted-file.mp3",
  "filename": "converted-file.mp3"
}
```

### Store-Nutzung

```javascript
// In einer Komponente
import { useAudioStore } from '@/stores/audioStore'

const audioStore = useAudioStore()

// Dateien hinzufügen
audioStore.addFiles(fileList)

// Konvertierung starten
await audioStore.convertAllFiles()

// Herunterladen
audioStore.downloadFile(file)
```

## 🎨 Styling & Theming

### CSS Variables

```css
:root {
  --primary-color: #3b82f6;
  --success-color: #4caf50;
  --error-color: #f44336;
  /* ... */
}

[data-theme="dark"] {
  --background: #0f172a;
  --text-color: #f1f5f9;
  /* ... */
}
```

### Theme wechseln

```javascript
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()
themeStore.toggleTheme()
```

## 🌍 Neue Sprache hinzufügen

### 1. Sprachdatei erstellen

```javascript
// src/locales/fr.js
export default {
  app: {
    title: 'Convertisseur Audio',
    subtitle: 'Convertissez vos fichiers audio rapidement'
  },
  // ... weitere Übersetzungen
}
```

### 2. In i18n registrieren

```javascript
// src/locales/index.js
import fr from './fr.js'

export const i18n = createI18n({
  messages: {
    de,
    en,
    fr  // Neue Sprache
  }
})
```

## 🔥 Features im Detail

### 1. Drag & Drop Upload
- Ziehe Dateien in den Upload-Bereich
- Automatische Format-Validierung
- Größenlimit: 300MB pro Datei

### 2. Batch-Konvertierung
- Mehrere Dateien gleichzeitig
- Fortschrittsanzeige pro Datei
- Fehlerbehandlung einzelner Dateien

### 3. Undo/Redo
- 20 Schritte History
- Aktionen rückgängig machen
- State-Wiederherstellung

### 4. Toast-Benachrichtigungen
```javascript
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

showToast('success', 'Erfolg!', {
  message: 'Datei wurde konvertiert',
  duration: 3000
})
```

## 📦 Production Build

```bash
# Build erstellen
npm run build

# Preview testen
npm run preview
```

Build-Output: `dist/`

## 🐛 Troubleshooting

### Problem: Backend-Verbindung fehlgeschlagen

**Lösung:**
- Prüfe ob Backend läuft: `http://localhost:3001`
- Überprüfe Proxy-Config in `vite.config.js`
- CORS-Einstellungen im Backend prüfen

### Problem: Dateien werden nicht hochgeladen

**Lösung:**
- Dateiformat prüfen (nur Audio)
- Dateigröße < 300MB
- Browser-Console auf Fehler prüfen

### Problem: i18n funktioniert nicht

**Lösung:**
- Prüfe Sprachdatei-Import in `locales/index.js`
- localStorage für gespeicherte Sprache prüfen
- Browser-Cache leeren

## 🚀 Deployment

### Vite Build optimieren

```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia', 'vue-i18n']
        }
      }
    }
  }
})
```

### Nginx-Konfiguration

```nginx
server {
  listen 80;
  server_name audio-converter.com;
  root /var/www/audio-converter/dist;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:3001;
  }

  location /files {
    proxy_pass http://localhost:3001;
  }
}
```

## 📊 Performance-Optimierungen

1. **Code-Splitting** - Automatisch durch Vite
2. **Lazy Loading** - Komponenten bei Bedarf laden
3. **Asset-Optimierung** - Bilder & Fonts komprimiert
4. **Caching** - Service Worker für PWA

## 🤝 Mitwirken

1. Fork das Projekt
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📝 Nächste Schritte

- [ ] Progressive Web App (PWA) Integration
- [ ] TypeScript Migration
- [ ] Unit Tests mit Vitest
- [ ] E2E Tests mit Playwright
- [ ] Service Worker für Offline-Support
- [ ] WebWorker für Konvertierung
- [ ] Weitere Formate (OPUS, AMR)

## 💡 Tipps & Tricks

### Development mit Hot Reload
Vite bietet ultraschnelles Hot Module Replacement (HMR):
- Änderungen werden sofort sichtbar
- State bleibt erhalten
- Kein vollständiger Reload nötig

### Vue DevTools verwenden
- Chrome/Firefox Extension installieren
- Komponenten-Tree inspizieren
- Pinia Store debuggen
- Performance messen

### VS Code Extensions
- Volar (Vue Language Features)
- ESLint
- Prettier
- Vue VSCode Snippets

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues öffnen
- Dokumentation lesen
- Community fragen

---

**Viel Erfolg mit der neuen Vue 3 Audio Konverter App! 🎉**
