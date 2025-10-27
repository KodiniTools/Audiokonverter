# Audio Konverter Desktop App

Desktop-Version der Audio Konverter Anwendung, erstellt mit Electron.

## Features

- Native Desktop-Anwendung für Windows, macOS und Linux
- **Integriertes Backend** - Keine separate Backend-Installation nötig
- **FFmpeg eingebettet** - Vollständig standalone und offline-fähig
- Native Datei-Dialoge für bessere UX
- Vollständig unabhängig von der Web-Anwendung
- **ZIP-Archive verfügbar** für portable Installation

## Voraussetzungen

- Node.js >= 16.0.0
- npm >= 8.0.0

## Installation

```bash
# Dependencies installieren
npm install
```

## Entwicklung

### Desktop-App im Development-Modus starten

```bash
npm run electron:dev
```

Dieser Befehl:
1. Baut die Vue-App für Electron
2. Startet die Electron-App

## Production Build

### Alle Plattformen

```bash
npm run electron:build
```

Erstellt Installer für die aktuelle Plattform.

### Windows-spezifisch

```bash
npm run electron:build:win
```

Erstellt:
- **NSIS Installer** (.exe) - Standard Windows Installer
- **MSI Installer** (.msi) - Windows Installer Package
- **ZIP Archive** (.zip) - Portable Version ohne Installation
- Alle für x64 und ia32 Architekturen

Die fertigen Pakete findest du im Ordner `dist-electron/`.

### macOS-spezifisch

```bash
npm run electron:build:mac
```

Erstellt:
- DMG Image
- ZIP Archive

### Linux-spezifisch

```bash
npm run electron:build:linux
```

Erstellt:
- AppImage (universal)
- DEB Package (Debian/Ubuntu)
- RPM Package (RedHat/Fedora)
- ZIP Archive (portable)

## Projektstruktur

```
Audiokonverter/
├── electron/                  # Electron-spezifische Dateien
│   ├── main.js               # Electron Main Process (mit Backend-Start)
│   └── preload.js            # Preload Script (IPC Bridge)
├── backend/                   # Integrierter Backend-Server
│   ├── server.js             # Express Server mit FFmpeg
│   └── package.json          # Backend Dependencies
├── src/                      # Vue.js Quellcode (geteilt mit Web)
│   ├── composables/
│   │   └── useElectron.js   # Electron-spezifische Funktionen
│   └── ...
├── dist/                     # Vue Build Output
├── dist-electron/            # Electron Build Output (Installer)
└── package.json
```

## Unterschiede zwischen Web und Desktop

### Web-Anwendung (`npm run build`)
- Baut für Web-Deployment
- Base-Path: `/audiokonverter/`
- Läuft im Browser
- Benötigt Backend-Server

### Desktop-Anwendung (`npm run electron:build`)
- Baut native Desktop-App
- Base-Path: `./` (relativ)
- Läuft als Standalone-App
- Native Datei-Dialoge
- **Backend automatisch integriert** - keine separate Installation nötig
- **FFmpeg eingebettet** - vollständig offline-fähig

## Desktop-spezifische Features

### Integriertes Backend

Die Desktop-App startet automatisch einen lokalen Backend-Server:

- **Automatischer Start**: Backend startet beim App-Start
- **FFmpeg eingebettet**: Alle Audio-Konvertierungen offline möglich
- **Port 3001**: Backend läuft lokal auf http://localhost:3001
- **Automatisches Beenden**: Backend stoppt beim Schließen der App
- **Keine Konfiguration nötig**: Alles funktioniert out-of-the-box

### Native Datei-Dialoge

Die Desktop-App verwendet native Betriebssystem-Dialoge:

```javascript
// In Vue-Komponenten
import { useElectron } from '@/composables/useElectron'

const { isElectron, selectFiles } = useElectron()

// Datei-Auswahl mit nativem Dialog
if (isElectron.value) {
  const files = await selectFiles()
}
```

### Plattform-Erkennung

```javascript
const { platform } = useElectron()

// 'win32', 'darwin', 'linux', oder 'web'
console.log(platform.value)
```

## Electron Builder Konfiguration

Die Build-Konfiguration befindet sich in `package.json` unter `"build"`:

```json
{
  "build": {
    "appId": "com.audiokonverter.app",
    "productName": "Audio Konverter",
    "win": {
      "target": ["nsis", "msi"]
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb", "rpm"]
    }
  }
}
```

## Wichtige Hinweise

### Unabhängigkeit von Web-App

Die Desktop-App ist **vollständig getrennt** von der Web-Anwendung:

- Web-Build: `npm run build` → `dist/` → `/audiokonverter/`
- Desktop-Build: `npm run electron:build` → `dist-electron/` → relative Pfade

**Die Web-App wird durch die Desktop-App nicht beeinflusst!**

### Technische Details

Das Backend ist in die Desktop-App integriert:

- **Express Server**: REST API für Audio-Konvertierung
- **FFmpeg**: Embedded via `ffmpeg-static` npm package
- **Automatische Verwaltung**: Electron startet/stoppt Backend
- **Temporäre Dateien**: Werden automatisch nach 1 Stunde gelöscht
- **Unterstützte Formate**: MP3, WAV, FLAC, OGG, AAC, M4A

### Icons

Die App verwendet `icon-512.png` als Anwendungs-Icon. Du kannst eigene Icons hinzufügen:

- Windows: `.ico` Format
- macOS: `.icns` Format
- Linux: `.png` Format

## Troubleshooting

### Build schlägt fehl

```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Electron-App startet nicht

Stelle sicher, dass die Vue-App zuerst gebaut wurde:

```bash
npm run build
npm run electron:dev
```

### MSI-Installer erstellt keinen Installer

MSI-Erstellung benötigt:
- Windows-Plattform (oder WSL)
- WiX Toolset (wird automatisch von electron-builder installiert)

## Deployment

### Windows

Die erstellten Pakete findest du unter:
```
dist-electron/
├── Audio Konverter Setup x.x.x.exe  (NSIS Installer)
├── Audio Konverter x.x.x.msi        (MSI Installer)
├── Audio Konverter x.x.x-win.zip    (Portable ZIP)
```

**Empfehlung**: NSIS oder MSI für Installation, ZIP für portable Nutzung

### macOS

```
dist-electron/
├── Audio Konverter-x.x.x.dmg        (DMG Image)
├── Audio Konverter-x.x.x-mac.zip    (ZIP Archive)
```

### Linux

```
dist-electron/
├── Audio Konverter-x.x.x.AppImage          (Universal)
├── audio-konverter_x.x.x_amd64.deb         (Debian/Ubuntu)
├── audio-konverter-x.x.x.x86_64.rpm        (RedHat/Fedora)
├── Audio Konverter-x.x.x-linux.zip         (Portable ZIP)
```

**Alle Pakete beinhalten FFmpeg und sind vollständig standalone!**

## Updates

Für Auto-Updates kannst du `electron-updater` integrieren:

```bash
npm install electron-updater
```

Siehe [Electron Builder Auto-Update](https://www.electron.build/auto-update) für Details.

## Lizenz

MIT License

## Support

Bei Fragen oder Problemen öffne bitte ein Issue im Repository.
