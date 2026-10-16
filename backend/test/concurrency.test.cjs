// Test der Begrenzung gleichzeitiger ffmpeg-Prozesse (FFMPEG_MAX_CONCURRENT,
// FFMPEG_MAX_QUEUE). Startet den Server selbst mit dem ffmpeg-Stub, der jede
// Konvertierung künstlich verlangsamt und Start/Ende protokolliert.
//
//   node backend/test/concurrency.test.cjs
const fs = require('fs')
const os = require('os')
const path = require('path')
const net = require('net')
const assert = require('assert')
const { spawn } = require('child_process')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

function convert(base, name, signal) {
  const fd = new FormData()
  fd.append('file', new Blob([Buffer.alloc(64)], { type: 'audio/wav' }), name)
  fd.append('format', 'mp3')
  return fetch(base + '/api/convert', { method: 'POST', body: fd, signal })
}

async function health(base) {
  return (await fetch(base + '/health')).json()
}

async function waitFor(check, what, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (await check()) return
    if (Date.now() > deadline) throw new Error('Zeitüberschreitung: ' + what)
    await sleep(25)
  }
}

;(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-concurrency-'))
  const binDir = path.join(tmp, 'bin')
  fs.mkdirSync(binDir)
  fs.symlinkSync(path.join(__dirname, 'ffmpeg-stub.sh'), path.join(binDir, 'ffmpeg'))
  const events = path.join(tmp, 'events.log')
  fs.writeFileSync(events, '')

  const port = await freePort()
  const base = 'http://127.0.0.1:' + port
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: {
      ...process.env,
      PATH: binDir + path.delimiter + process.env.PATH,
      PORT: String(port),
      FILES_DIR: path.join(tmp, 'files'),
      CONVERT_TTL_MS: '0',
      FFMPEG_MAX_CONCURRENT: '1',
      FFMPEG_MAX_QUEUE: '1',
      FFMPEG_STUB_DELAY: '0.6',
      FFMPEG_STUB_EVENTS: events,
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  })

  try {
    await waitFor(
      () =>
        health(base)
          .then((h) => h.ok)
          .catch(() => false),
      'Serverstart'
    )
    const h0 = await health(base)
    assert.deepStrictEqual(
      h0.ffmpeg,
      { running: 0, queued: 0, maxConcurrent: 1, maxQueue: 1 },
      'health meldet die Grenzen'
    )
    console.log('[1] health meldet Grenzen', h0.ffmpeg)

    // 2) Drei gleichzeitige Anfragen bei 1 Platz + 1 Warteplatz:
    // eine läuft, eine wartet, die dritte bekommt sofort 503.
    const a = convert(base, 'a.wav')
    await waitFor(async () => (await health(base)).ffmpeg.running === 1, 'a läuft')
    const b = convert(base, 'b.wav')
    await waitFor(async () => (await health(base)).ffmpeg.queued === 1, 'b wartet')
    const c = await convert(base, 'c.wav')
    assert.strictEqual(c.status, 503, 'dritte Anfrage -> 503')
    assert.strictEqual((await c.json()).error, 'server_busy')
    const [ra, rb] = await Promise.all([a, b])
    assert.strictEqual(ra.status, 200, 'a ok')
    assert.strictEqual(rb.status, 200, 'b ok')
    console.log('[2] 1 läuft, 1 wartet, 1 -> 503 server_busy')

    // 3) Nie mehr als ein ffmpeg gleichzeitig: Start/Ende wechseln sich ab.
    const lines = fs.readFileSync(events, 'utf8').trim().split('\n')
    assert.deepStrictEqual(
      lines.map((l) => l.split(' ')[0]),
      ['start', 'end', 'start', 'end'],
      'ffmpeg-Läufe überlappen nicht'
    )
    console.log('[3] keine Überlappung:', lines.length / 2, 'Läufe nacheinander')

    // 4) Bricht ein wartender Client ab, verlässt er die Schlange und
    // ffmpeg läuft für ihn nicht mehr.
    fs.writeFileSync(events, '')
    const d = convert(base, 'd.wav')
    await waitFor(async () => (await health(base)).ffmpeg.running === 1, 'd läuft')
    const abort = new AbortController()
    const e = convert(base, 'e.wav', abort.signal).catch((err) => err)
    await waitFor(async () => (await health(base)).ffmpeg.queued === 1, 'e wartet')
    abort.abort()
    assert.strictEqual((await e).name, 'AbortError')
    await waitFor(async () => (await health(base)).ffmpeg.queued === 0, 'e aus der Schlange')
    assert.strictEqual((await d).status, 200, 'd ok')
    await waitFor(async () => (await health(base)).ffmpeg.running === 0, 'Platz frei')
    const runs = fs.readFileSync(events, 'utf8').trim().split('\n')
    assert.deepStrictEqual(
      runs.map((l) => l.split(' ')[0]),
      ['start', 'end'],
      'nur d lief'
    )
    console.log('[4] abgebrochener Wartender belegt keinen Platz')

    console.log('\nAlle Parallelitäts-Checks bestanden.')
  } finally {
    server.kill()
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})().catch((err) => {
  console.error('FEHLGESCHLAGEN:', err.message)
  process.exit(1)
})
