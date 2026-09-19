// Integrationstest für das eigenständige Audiokonverter-Backend.
//
// Start (Aufrufbeispiel siehe backend/README.md):
//   PORT=9105 FILES_DIR=$(mktemp -d) node backend/test/convert.test.cjs
//
// Ohne installiertes ffmpeg kann backend/test/ffmpeg-stub.sh als Ersatz in den
// PATH gelegt werden (kopiert die Eingabe auf die Ausgabe).
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const FILES_DIR = process.env.FILES_DIR
const BASE = 'http://127.0.0.1:' + process.env.PORT

require(process.env.SERVER_PATH || path.join(__dirname, '..', 'server.js'))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  await sleep(500)

  // 1) Konvertieren — genau das, was die Oberfläche aufruft
  const fd = new FormData()
  fd.append('file', new Blob([Buffer.alloc(2048)], { type: 'audio/wav' }), 'Song 1.wav')
  fd.append('format', 'mp3')
  fd.append('bitrate', '192k')
  const conv = await (await fetch(BASE + '/api/convert', { method: 'POST', body: fd })).json()
  assert.strictEqual(conv.ok, true, 'convert ok')
  assert.ok(conv.url.startsWith('/files/'), 'url zeigt auf /files')
  assert.ok(conv.size > 0, 'size gesetzt')
  const file = conv.filename
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei erzeugt')
  console.log('[1] convert ok ->', file)

  // 2) Ergebnis ist über /files abrufbar (so lädt die Oberfläche herunter)
  let r = await fetch(`${BASE}/files/${encodeURIComponent(file)}`)
  assert.strictEqual(r.status, 200, '/files liefert die Datei')
  const bytes = Buffer.from(await r.arrayBuffer())
  assert.strictEqual(bytes.length, conv.size, 'Groesse stimmt mit der Convert-Antwort ueberein')
  console.log('[2] /files/<name> -> 200,', bytes.length, 'Bytes')

  // 3) Ergebnisse bleiben liegen: der Sweeper ist standardmässig aus,
  // die Oberfläche verteilt Links auf die Serverdatei.
  await sleep(200)
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei bleibt erhalten')
  console.log('[3] Ergebnis bleibt erhalten (CONVERT_TTL_MS=0)')

  // 4) Ungültige Parameter werden abgewiesen
  for (const [feld, wert] of [
    ['format', 'exe'],
    ['bitrate', 'abc'],
    ['samplerate', '99'],
  ]) {
    const bad = new FormData()
    bad.append('file', new Blob([Buffer.alloc(64)]), 'x.wav')
    bad.append('format', feld === 'format' ? wert : 'mp3')
    if (feld !== 'format') bad.append(feld, wert)
    r = await fetch(BASE + '/api/convert', { method: 'POST', body: bad })
    assert.strictEqual(r.status, 400, `${feld}=${wert} -> 400`)
  }
  console.log('[4] ungueltige Parameter -> 400')

  // 5) Ohne Datei kein Ergebnis
  const leer = new FormData()
  leer.append('format', 'mp3')
  r = await fetch(BASE + '/api/convert', { method: 'POST', body: leer })
  assert.strictEqual(r.status, 500, 'ohne Datei -> Fehler')
  console.log('[5] ohne Datei -> Fehler')

  // 6) Health
  const health = await (await fetch(BASE + '/health')).json()
  assert.strictEqual(health.ok, true, 'health ok')
  assert.strictEqual(health.service, 'audiokonverter', 'health nennt den Dienst')
  console.log('[6] health ok')

  // 7) Die Endpunkte des gemeinsamen Backends existieren hier nicht mehr.
  // /api/tracks gab früher die Dateinamen aller Konvertierungen preis.
  const entfernt = [
    ['GET', '/api/tracks'],
    ['DELETE', '/api/files/clear'],
    ['POST', '/api/login'],
    ['GET', '/api/playlists'],
    ['GET', '/api/player/state'],
    ['POST', '/api/upload'],
    ['GET', '/api/job/abc'],
  ]
  for (const [method, route] of entfernt) {
    const resp = await fetch(BASE + route, { method })
    assert.strictEqual(resp.status, 404, `${method} ${route} -> 404`)
    const body = await resp.text()
    assert.ok(!body.includes(file), `${route} gibt keine Dateinamen preis`)
  }
  console.log('[7] entfernte Endpunkte ->', entfernt.length + 'x 404')

  console.log('\nAlle Backend-Checks bestanden.')
  process.exit(0)
})().catch((e) => {
  console.error('FEHLGESCHLAGEN:', e.message)
  process.exit(1)
})
