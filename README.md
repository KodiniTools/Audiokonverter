# 🎵 Audio Konverter Vue 3

Eine moderne Audio-Konverter-Anwendung mit Vue 3, Vite und i18n-Unterstützung.

## ✨ Features

- 🎯 **Modern & Responsiv** - Gebaut mit Vue 3 Composition API
- 🌍 **Mehrsprachig** - Deutsch & Englisch mit Vue I18n
- 🎨 **Dark Mode** - Automatischer Theme-Wechsel
- 📦 **Drag & Drop** - Intuitive Datei-Upload-Funktion
- 🔄 **Batch-Konvertierung** - Mehrere Dateien gleichzeitig
- 💾 **Undo/Redo** - Aktionsverlauf mit History
- 🎛️ **Flexible Einstellungen** - Format & Qualität anpassbar
- 📱 **Mobile-Ready** - Optimiert für alle Geräte

## 🚀 Unterstützte Formate

**Input & Output:**
- MP3
- WAV
- FLAC
- OGG Vorbis
- AAC
- M4A

## 🛠️ Technologie-Stack

- **Frontend:** Vue 3 + Vite
- **State Management:** Pinia
- **i18n:** Vue I18n
- **Icons:** FontAwesome
- **Styling:** CSS3 mit CSS Variables

## 📦 Installation

### Voraussetzungen

- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup

1. **Dependencies installieren:**
```bash
npm install
```

2. **Development Server starten:**
```bash
npm run dev
```

3. **Production Build erstellen:**
```bash
npm run build
```

4. **Preview Production Build:**
```bash
npm run preview
```

## 🔧 Backend-Integration

Das Frontend ist konfiguriert, um mit einem Backend-Server zu kommunizieren:

- **Backend URL:** `http://localhost:3001`
- **API Endpunkte:**
  - `POST /api/convert` - Datei-Konvertierung
  - `GET /files/:filename` - Download konvertierte Dateien

### Backend starten

Stelle sicher, dass der Backend-Server läuft:

```bash
cd backend
npm install
npm start
```

## 📁 Projektstruktur

```
audio-converter-vue/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Globale Styles
│   ├── components/
│   │   ├── HeaderNav.vue         # Navigation
│   │   ├── HeaderTitle.vue       # Titel
│   │   ├── FileUpload.vue        # Drag & Drop Upload
│   │   ├── FileList.vue          # Dateiliste
│   │   ├── ConversionSettings.vue # Konvertierungs-Einstellungen
│   │   ├── GlobalActions.vue     # Globale Aktionen
│   │   ├── StatusDisplay.vue     # Status-Anzeige
│   │   ├── FaqSection.vue        # FAQ
│   │   └── ToastContainer.vue    # Toast-Benachrichtigungen
│   ├── composables/
│   │   └── useToast.js           # Toast Composable
│   ├── locales/
│   │   ├── de.js                 # Deutsche Übersetzungen
│   │   ├── en.js                 # Englische Übersetzungen
│   │   └── index.js              # i18n Konfiguration
│   ├── stores/
│   │   ├── audioStore.js         # Audio State Management
│   │   └── themeStore.js         # Theme State Management
│   ├── App.vue                   # Hauptkomponente
│   └── main.js                   # Entry Point
├── public/                        # Statische Assets
├── index.html                     # HTML Template
├── vite.config.js                 # Vite Konfiguration
└── package.json                   # Dependencies

```

## 🌍 Internationalisierung (i18n)

Die App unterstützt mehrere Sprachen:

- **Deutsch (de)** - Standard
- **Englisch (en)**

### Sprache hinzufügen

1. Erstelle neue Sprachdatei in `src/locales/`:
```javascript
// src/locales/fr.js
export default {
  app: {
    title: 'Convertisseur Audio',
    // ...
  }
}
```

2. Import in `src/locales/index.js`:
```javascript
import fr from './fr.js'

export const i18n = createI18n({
  messages: {
    de,
    en,
    fr  // Neue Sprache hinzufügen
  }
})
```

## 🎨 Theming

Die App unterstützt Light & Dark Mode:

- **Automatische Erkennung** - Folgt System-Präferenz
- **Manueller Wechsel** - Toggle-Button in Navigation
- **Persistenz** - Theme wird in localStorage gespeichert

### CSS Variablen anpassen

```css
:root {
  --primary-color: #3b82f6;
  --success-color: #4caf50;
  --error-color: #f44336;
  /* ... */
}
```

## 🔌 API Integration

### Konvertierungs-Request

```javascript
const formData = new FormData()
formData.append('file', audioFile)
formData.append('format', 'mp3')
formData.append('quality', '7')

const response = await axios.post('/api/convert', formData)
```

### Response Format

```json
{
  "ok": true,
  "output": "/files/converted-file.mp3",
  "filename": "converted-file.mp3"
}
```

## 📝 Konfiguration

### Vite Proxy (vite.config.js)

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:3001',
    '/files': 'http://localhost:3001'
  }
}
```

## 🧪 Testing

```bash
npm run lint
```

## 📱 Browser-Unterstützung

- Chrome/Edge (letzte 2 Versionen)
- Firefox (letzte 2 Versionen)
- Safari (letzte 2 Versionen)
- Mobile Browser (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle einen Pull Request.

## 📄 License

MIT License

## 👨‍💻 Autor

Kodini Tools

## 🙏 Credits

- Vue.js Team
- FontAwesome
- Vite Team
- Vue I18n Team

---

**Viel Spaß beim Konvertieren! 🎵**
