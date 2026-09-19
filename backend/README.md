# Audiokonverter — eigenständiges Backend

`server.js` ist das Backend des Audiokonverters. Es löst die Nutzung der
geteilten Datei `/var/www/kodinitools.com/_backend_common/server.js` ab.

## Warum eigenständig

`_backend_common/server.js` wurde von `audiokonverter-server` **und**
`mp3konverter-server` geladen. Das hatte in der Praxis diese Folgen:

- Eine Änderung für das eine Tool landete beim nächsten Neustart automatisch im
  anderen. Ein TTL-Sweeper, der für den MP3 Konverter gebaut wurde, hätte hier
  Ergebnisse nach 60 Minuten gelöscht — und die Oberfläche verteilt Links auf
  genau diese Serverdateien.
- Der Audiokonverter erbte Endpunkte, die er nie brauchte. Darunter
  `GET /api/tracks` ohne Auth: Es lieferte Dateiname, Größe und URL **jeder**
  Datei im `FILES_DIR`. Zusammen mit der statischen Auslieferung von `/files/`
  waren damit die Konvertierungen fremder Nutzer auflistbar und herunterladbar.
- Die Datei lag in keinem Repository: kein Review, kein Test, Deploy von Hand.

Die Kopie, die bisher im Repo-Root lag (`server.js`, 746 Zeilen), war veraltet
und wurde nie ausgeführt — `ecosystem.config.cjs` zeigte auf `_backend_common`.
Sie ist entfernt; bei Bedarf liegt sie in der Git-History.

## Was drin ist — und was bewusst fehlt

| Endpunkt | Zweck |
| --- | --- |
| `GET /health` | Statusprobe für nginx und Monitoring |
| `GET /files/<name>` | Ergebnis herunterladen (statisch, kein Verzeichnis-Listing) |
| `POST /api/convert` | Datei konvertieren, liefert `url`, `filename`, `size` |

Mehr ruft die Oberfläche nicht auf (`src/stores/audioStore.ts`). Entfernt sind
Login/Auth, Playlists, Player-State, `/api/tracks`, `/api/upload`,
`/api/files/*`, der Async-Job-Modus und der Konvertier-Zweig über `file_url`.
Der Integrationstest prüft, dass diese Routen nicht mehr existieren.

Die Konvertierung selbst ist unverändert: dieselben ffmpeg-Argumente je Format,
dieselbe Namensbildung (`<basis>-<nanoid6>.<ext>`), dasselbe Upload-Limit.

## Konfiguration

| Variable | Default | Bedeutung |
| --- | --- | --- |
| `PORT` | `9000` | nginx proxied `/audiokonverter/` hierher |
| `FILES_DIR` | `<dieser Ordner>/files` | in `ecosystem.config.cjs` auf `/var/www/kodinitools.com/audiokonverter/files` gesetzt |
| `CONVERT_TTL_MS` | `21600000` (6 h) | Ergebnisse älter als dieser Wert werden automatisch gelöscht; `0` schaltet das Aufräumen ab. Siehe unten. |
| `FFMPEG_TIMEOUT_MS` | `120000` | Abbruch langer Konvertierungen |
| `MAX_UPLOAD_BYTES` | `314572800` | 300 MB |

**Zum Aufräumen:** Die Oberfläche lädt das Ergebnis inzwischen sofort per
`fetch` als Blob herunter (Speicherort-Dialog), hält aber weiterhin einen Link
auf die Serverdatei. Damit sich die Ergebnisse nicht endlos ansammeln und
manuell gelöscht werden müssen, ist der Sweeper standardmäßig **an** mit einer
großzügigen Aufbewahrung von **6 Stunden** (`CONVERT_TTL_MS`). Das ist lang
genug, dass ein offener Tab die Datei noch herunterladen kann, und räumt sie
danach automatisch weg. Der Sweeper läuft beim Start und danach alle 5 Minuten;
er geht direkt über `FILES_DIR` (nicht über eine Prozessliste), sodass auch
Altbestände und Dateien aus früheren Läufen erfasst werden. Gelöscht werden
ausschließlich Audio-Ergebnisse (`.mp3`, `.wav`, `.flac`, `.aac`, `.ogg`,
`.m4a`, `.wma`, `.opus`, `.aiff`); alles andere in `FILES_DIR` bleibt unberührt.
Wer das Aufräumen abschalten will, setzt `CONVERT_TTL_MS=0`.

## Migration ohne Ausfall

Der neue Prozess wird erst auf einem **freien Port** geprüft und der Port
9000 erst danach übernommen. Fällt der Test durch, läuft der alte Dienst
unverändert weiter.

```bash
# 1) Repo-Stand holen
cd /opt/audiokonverter   # bzw. der Checkout auf dem Server
git fetch origin main && git reset --hard origin/main

# 2) Gegenprobe, dass der Checkout wirklich das neue Backend trägt
grep -A5 '"dependencies"' backend/package.json   # express, multer, nanoid
head -3 backend/server.js                        # "Audiokonverter — eigenständiges Backend"

# 3) Backend an seinen Ort bringen
BACKEND_DIR=/var/www/kodinitools.com/audiokonverter-backend
mkdir -p "$BACKEND_DIR"
rsync -a --exclude '/node_modules' --exclude '/files' backend/ "$BACKEND_DIR"/
npm --prefix "$BACKEND_DIR" install --omit=dev
test -d "$BACKEND_DIR/node_modules" || { echo "FEHLER: Abhängigkeiten fehlen"; exit 1; }

# 4) Auf einem freien Port prüfen – der alte Dienst läuft dabei weiter.
# Den Port sucht das Betriebssystem aus: feste Nummern sind auf diesem
# Server schnell belegt.
cd "$BACKEND_DIR"
FREE_PORT=$(node -e "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>console.log(p))})")
ffmpeg -loglevel error -y -f lavfi -i "sine=frequency=440:duration=1" -ac 1 -ar 44100 /tmp/ak-test.wav

PORT=$FREE_PORT FILES_DIR=/tmp/ak-test node server.js &
TESTPID=$!
sleep 2
curl -s http://127.0.0.1:$FREE_PORT/health; echo
curl -s -F "file=@/tmp/ak-test.wav" -F "format=mp3" -F "bitrate=192k" \
  http://127.0.0.1:$FREE_PORT/api/convert; echo
for r in /api/tracks /api/playlists /api/upload; do
  curl -s -o /dev/null -w "$r: %{http_code}\n" http://127.0.0.1:$FREE_PORT$r
done
kill $TESTPID
```

Erwartet: `"service":"audiokonverter"`, eine Convert-Antwort mit `size` deutlich
über 0 und dreimal `404`.

Erst dann den Port übernehmen. `ecosystem.config.cjs` trägt die Endung `.cjs`,
weil `package.json` im Repo-Root `"type": "module"` setzt — als `.js` lehnt pm2
die Datei mit „module is not defined in ES module scope" ab:

```bash
pm2 delete audiokonverter-server
pm2 start /opt/audiokonverter/ecosystem.config.cjs
pm2 save

curl -s http://127.0.0.1:9000/health; echo
curl -s -o /dev/null -w '%{http_code}\n' https://kodinitools.com/audiokonverter/api/tracks
```

Danach im Browser eine Datei konvertieren und herunterladen. Im Log müssen
`[convert start]` und `[convert ok]` stehen, und der Download-Link muss
funktionieren.

### Rollback

```bash
pm2 delete audiokonverter-server
cd /var/www/kodinitools.com/_backend_common
PORT=9000 FILES_DIR=/var/www/kodinitools.com/audiokonverter/files \
  pm2 start server.js --name audiokonverter-server --update-env
pm2 save
```

## Deploy danach

`deploy.sh` übernimmt das Backend mit, sobald `BACKEND_DIR` existiert: rsync
ohne `node_modules` und `files/`, Installation, `pm2 reload` und anschließend
ein `/health`-Check. Schlägt der fehl, endet das Deploy mit Fehler statt mit
„abgeschlossen". Steuerbar über `DEPLOY_BACKEND_DIR`, `DEPLOY_BACKEND_PORT` und
`DEPLOY_SKIP_BACKEND=1`.

## Test

```bash
npm --prefix backend install
PORT=9105 FILES_DIR=$(mktemp -d) node backend/test/convert.test.cjs
```

Geprüft werden Convert, Abruf über `/files`, dass Ergebnisse liegen bleiben,
Parametervalidierung und dass die entfernten Endpunkte 404 liefern. Ein anderer
Port als der Produktivport (9000) ist Pflicht — der Test startet einen eigenen
Serverprozess. Ohne installiertes `ffmpeg` kann `test/ffmpeg-stub.sh` als Ersatz
in den `PATH` gelegt werden (kopiert die Eingabe auf die Ausgabe).

## Abhängigkeiten

`server.js` ist CommonJS und lädt alles per `require()`. Für **nanoid** heißt
das: Version 3 ist Pflicht (dual CJS/ESM). Ab Version 4 ist nanoid ESM-only;
Node lädt es dann nur über das experimentelle „ESM in require()" und warnt beim
Start — ein Node-Update kann den Start dann kippen. `package.json` pinnt deshalb
`^3.3.19`; ältere 3.x-Versionen als 3.3.8 enthalten zudem die Endlosschleife aus
GHSA-mwcw-c2x4-8c55. Gegenprobe:

```bash
node -p "require.resolve('nanoid')"   # muss auf index.cjs zeigen
```
