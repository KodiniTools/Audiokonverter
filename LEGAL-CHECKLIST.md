# ⚖️ Rechtliche Checkliste für Audio Konverter Desktop App

## Übersicht

Diese Checkliste hilft Ihnen, die Desktop-App **Audio Konverter** rechtlich korrekt zu verbreiten und zu verkaufen.

---

## ✅ Bereits implementiert

### 1. Lizenztexte
- ✅ **LICENSES.txt** Datei erstellt mit allen verwendeten Open-Source-Lizenzen
- ✅ MIT Lizenz für Electron, Vue.js, Pinia, Axios, JSZip
- ✅ LGPL v2.1 für FFmpeg
- ✅ Font Awesome Free License für Icons

### 2. About/Über-Dialog
- ✅ Zeigt alle verwendeten Open-Source-Komponenten
- ✅ Links zu Lizenzen und Quellcode
- ✅ Button zum Öffnen der vollständigen LICENSES.txt
- ✅ Verfügbar in Deutsch und Englisch

### 3. Build-Konfiguration
- ✅ Author "Kodini Tools" in package.json
- ✅ LICENSES.txt wird im Build-Prozess inkludiert

---

## 📋 Vor der Verbreitung prüfen

### A. Rechtliche Dokumente

- [ ] **LICENSES.txt prüfen**
  - Alle verwendeten Bibliotheken aufgeführt?
  - Lizenztexte vollständig?
  - FFmpeg LGPL-Hinweis korrekt?

- [ ] **About-Dialog testen**
  - Öffnet sich korrekt?
  - Alle Links funktionieren?
  - LICENSES.txt wird korrekt geöffnet?

- [ ] **Eigene Software-Lizenz definieren**
  - Was dürfen Endbenutzer mit der App tun?
  - Beispiel: "Proprietäre Software © 2024 Kodini Tools"
  - Oder: "Kostenlos für persönliche Nutzung"

### B. Datenschutz

- [ ] **Datenschutzerklärung**
  - Falls Telemetrie/Analytics: Datenschutzerklärung erforderlich
  - Aktuell: App sammelt KEINE Nutzerdaten ✅
  - Alle Konvertierungen erfolgen lokal ✅

- [ ] **DSGVO (falls EU-Vertrieb)**
  - Keine personenbezogenen Daten gespeichert ✅
  - Keine Datenübertragung an Server ✅

### C. Kommerzielle Aspekte

- [ ] **Preismodell festlegen**
  - Einmalzahlung?
  - Abonnement?
  - Kostenlos mit Premium-Features?

- [ ] **Zahlungsanbieter**
  - Falls kostenpflichtig: Stripe, PayPal, etc.
  - AGB für Verkauf erstellen

- [ ] **Support & Updates**
  - Support-Kanal definieren (E-Mail, Forum, etc.)
  - Update-Mechanismus (falls gewünscht)

### D. Branding & Marketing

- [ ] **Markenrechte prüfen**
  - Name "Audio Konverter" ist generisch (gut!)
  - Logo/Icon erstellt?
  - Keine Markenverletzungen?

- [ ] **Website/Landing Page**
  - Produktbeschreibung
  - Download-Links
  - Impressum (falls geschäftlich in DE/EU)

---

## ⚠️ Wichtige LGPL-Pflichten für FFmpeg

### Was Sie MÜSSEN:

1. ✅ **LGPL-Lizenztext mitliefern** (bereits in LICENSES.txt)
2. ✅ **Erwähnen, dass FFmpeg verwendet wird** (im About-Dialog)
3. ✅ **Link zur FFmpeg-Quelle** (https://ffmpeg.org/)
4. ✅ **Keine FFmpeg-Änderungen** (wir nutzen unveränderte Binaries)

### Was Sie NICHT müssen:

- ❌ FFmpeg-Lizenz kaufen
- ❌ Ihre eigene App Open-Source machen
- ❌ Ihren Quellcode veröffentlichen
- ❌ Gebühren an FFmpeg zahlen

### Was verboten ist:

- ❌ FFmpeg als "eigene" Software ausgeben
- ❌ LGPL-Lizenzhinweise entfernen
- ❌ FFmpeg ohne Lizenzhinweis verbreiten

---

## 🌍 Vertrieb in verschiedenen Regionen

### Deutschland / EU
- ✅ LGPL erlaubt kommerzielle Nutzung
- ⚠️ Impressumspflicht bei geschäftlicher Website
- ⚠️ DSGVO beachten (aktuell: keine Daten gespeichert)

### USA
- ✅ LGPL erlaubt kommerzielle Nutzung
- ⚠️ Software License Agreement empfohlen

### Weltweit
- ✅ Open-Source-Lizenzen sind international gültig
- ✅ Keine Export-Beschränkungen für diese Software

---

## 📄 Empfohlene zusätzliche Dokumente

### 1. End-User License Agreement (EULA)
```
Beispiel-Struktur:
- Lizenz-Gewährung (was darf der Nutzer?)
- Einschränkungen (keine Reverse Engineering, etc.)
- Haftungsausschluss
- Kündigungsklausel
```

### 2. Impressum (falls Website in DE/EU)
```
Erforderlich wenn geschäftlich:
- Name und Anschrift
- Kontaktdaten
- USt-IdNr. (falls vorhanden)
- Handelsregister (falls eingetragen)
```

### 3. AGB (falls Verkauf)
```
- Vertragsabschluss
- Preise und Zahlungsbedingungen
- Widerrufsrecht (EU: 14 Tage)
- Gewährleistung
```

---

## ✅ Finale Checkliste vor Release

### Technisch:
- [ ] LICENSES.txt im Build enthalten?
- [ ] About-Dialog funktioniert?
- [ ] Alle Funktionen getestet?
- [ ] Installer signiert? (optional, aber empfohlen)

### Rechtlich:
- [ ] LICENSES.txt geprüft?
- [ ] Eigene Lizenz/EULA erstellt?
- [ ] Datenschutzerklärung (falls nötig)?
- [ ] Impressum auf Website (falls DE/EU)?

### Geschäftlich:
- [ ] Preismodell festgelegt?
- [ ] Zahlungsabwicklung eingerichtet?
- [ ] Support-Kanal definiert?
- [ ] Marketing-Materialien bereit?

---

## 🆘 Bei rechtlichen Fragen

**WICHTIG:** Diese Checkliste ist keine Rechtsberatung!

Konsultieren Sie einen Anwalt für:
- Spezifische Lizenzfragen
- Internationale Verbreitung
- Große Unternehmen als Kunden
- Patentfragen (selten bei Audio-Apps)

**Allgemeine Ressourcen:**
- https://www.gnu.org/licenses/lgpl-faq.html (LGPL FAQ)
- https://choosealicense.com/ (Lizenz-Überblick)
- Lokale IHK/Handelskammer (DE)

---

## ✅ Zusammenfassung

**Sie KÖNNEN die App kommerziell vertreiben, weil:**
- ✅ Electron = MIT Lizenz (kommerzielle Nutzung erlaubt)
- ✅ FFmpeg = LGPL (kommerzielle Nutzung erlaubt)
- ✅ Alle Dependencies = MIT/Apache (kommerziell freundlich)

**Sie MÜSSEN nur:**
1. ✅ LICENSES.txt mitliefern (bereits implementiert)
2. ✅ FFmpeg-Nutzung erwähnen (bereits implementiert)
3. ✅ About-Dialog zeigen (bereits implementiert)

**Kosten:** **€ 0,00** für Open-Source-Lizenzen ✅

---

**Stand:** 2024-10-27
**Version:** 2.0.0
**Copyright:** © 2024 Kodini Tools
