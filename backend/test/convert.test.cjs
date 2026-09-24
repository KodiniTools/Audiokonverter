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

/**
 * Eine echte, winzige WAV-Datei (PCM 16 bit, mono, Stille).
 * Ein Dummy-Buffer reicht nicht: Das echte ffmpeg lehnt ihn mit
 * "Invalid data found when processing input" ab.
 */
function wavBuffer(seconds = 0.2, sampleRate = 8000) {
  const numSamples = Math.floor(seconds * sampleRate)
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16) // Groesse des fmt-Chunks
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28) // Byte-Rate
  buf.writeUInt16LE(2, 32) // Block-Align
  buf.writeUInt16LE(16, 34) // Bits pro Sample
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  return buf
}

;(async () => {
  await sleep(500)

  // 1) Konvertieren — genau das, was die Oberfläche aufruft
  const fd = new FormData()
  fd.append('file', new Blob([wavBuffer()], { type: 'audio/wav' }), 'Song 1.wav')
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

  // 8) WebM wird als Eingabe angenommen; die Videospur wird verworfen (-vn).
  // Nur bei WebM — sonst ginge eingebettetes Cover-Art anderer Formate verloren.
  // Der Inhalt ist WAV: ffmpeg erkennt das Format am Inhalt, nicht am Namen.
  const argsLog = process.env.FFMPEG_ARGS_LOG
  for (const [name, type, erwartetVn] of [
    ['Aufnahme.webm', 'video/webm', true],
    ['Sprache.weba', 'audio/webm', true],
    ['Song 2.wav', 'audio/wav', false],
  ]) {
    if (argsLog) fs.writeFileSync(argsLog, '')
    const wfd = new FormData()
    wfd.append('file', new Blob([wavBuffer()], { type }), name)
    wfd.append('format', 'ogg')
    const wr = await (await fetch(BASE + '/api/convert', { method: 'POST', body: wfd })).json()
    assert.strictEqual(wr.ok, true, `${name} -> convert ok`)
    if (argsLog) {
      const hatVn = fs.readFileSync(argsLog, 'utf8').split(/\s+/).includes('-vn')
      assert.strictEqual(
        hatVn,
        erwartetVn,
        `${name}: -vn ${erwartetVn ? 'gesetzt' : 'nicht gesetzt'}`
      )
    }
  }
  console.log('[8] WebM-Eingabe ok' + (argsLog ? ' (-vn nur bei WebM)' : ''))

  console.log('\nAlle Backend-Checks bestanden.')
  process.exit(0)
})().catch((e) => {
  console.error('FEHLGESCHLAGEN:', e.message)
  process.exit(1)
})
