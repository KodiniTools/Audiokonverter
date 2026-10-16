// Test des Job-Modus: POST /api/convert mit mode=job, Fortschritt per
// Server-Sent Events (GET /api/jobs/:id/events), Abbruch per DELETE und
// Abbruch verwaister Jobs. Startet den Server selbst mit ffmpeg- und
// ffprobe-Stub; der ffmpeg-Stub meldet Fortschritt wie `-progress pipe:1`.
//
//   node backend/test/jobs.test.cjs
const fs = require('fs')
const os = require('os')
const path = require('path')
const net = require('net')
const assert = require('assert')
const { spawn } = require('child_process')
const { parseProgressSeconds, progressPercent } = require('../jobs')

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

function convert(base, { mode } = {}) {
  const fd = new FormData()
  fd.append('file', new Blob([Buffer.alloc(64)], { type: 'audio/wav' }), 'song.wav')
  fd.append('format', 'mp3')
  fd.append('quality', '7')
  if (mode) fd.append('mode', mode)
  return fetch(base + '/api/convert', { method: 'POST', body: fd })
}

/**
 * Liest einen SSE-Stream bis zum Ende. `onEvent` darf während des Lesens
 * eingreifen (z. B. abbrechen).
 */
async function readEvents(url, onEvent = () => {}) {
  const resp = await fetch(url)
  assert.strictEqual(resp.status, 200, 'SSE-Status')
  assert.match(resp.headers.get('content-type'), /^text\/event-stream/)
  assert.strictEqual(resp.headers.get('x-accel-buffering'), 'no')
  const events = []
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of resp.body) {
    buffer += decoder.decode(chunk, { stream: true })
    let end
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      const event = /^event: (.+)$/m.exec(frame)
      const data = /^data: (.+)$/m.exec(frame)
      if (!event || !data) continue
      const parsed = { event: event[1], data: JSON.parse(data[1]) }
      events.push(parsed)
      await onEvent(parsed)
    }
  }
  return events
}

async function waitFor(check, what, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (await check()) return
    if (Date.now() > deadline) throw new Error('Zeitüberschreitung: ' + what)
    await sleep(25)
  }
}

function unitChecks() {
  assert.strictEqual(parseProgressSeconds('out_time_us=2500000'), 2.5)
  assert.strictEqual(parseProgressSeconds('out_time_ms=1000000'), 1)
  assert.strictEqual(parseProgressSeconds('out_time_us=N/A'), null)
  assert.strictEqual(parseProgressSeconds('progress=continue'), null)
  assert.strictEqual(progressPercent(5, 10), 50)
  assert.strictEqual(progressPercent(12, 10), 99, 'nie 100 vor dem Ende')
  assert.strictEqual(progressPercent(5, null), null, 'ohne Dauer kein Prozentwert')
  console.log('[1] Auswertung von -progress und Prozentrechnung ok')
}

;(async () => {
  unitChecks()

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-jobs-'))
  const binDir = path.join(tmp, 'bin')
  const filesDir = path.join(tmp, 'files')
  fs.mkdirSync(binDir)
  fs.symlinkSync(path.join(__dirname, 'ffmpeg-stub.sh'), path.join(binDir, 'ffmpeg'))
  fs.symlinkSync(path.join(__dirname, 'ffprobe-stub.sh'), path.join(binDir, 'ffprobe'))
  const stubEvents = path.join(tmp, 'ffmpeg-events.log')
  fs.writeFileSync(stubEvents, '')
  const stubLog = () => fs.readFileSync(stubEvents, 'utf8').trim().split('\n').filter(Boolean)

  const port = await freePort()
  const base = 'http://127.0.0.1:' + port
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: {
      ...process.env,
      PATH: binDir + path.delimiter + process.env.PATH,
      PORT: String(port),
      FILES_DIR: filesDir,
      CONVERT_TTL_MS: '0',
      JOB_ORPHAN_MS: '400',
      FFPROBE_STUB_DURATION: '10',
      FFMPEG_STUB_PROGRESS_US: '2500000 5000000 7500000',
      FFMPEG_STUB_STEP_DELAY: '0.15',
      FFMPEG_STUB_EVENTS: stubEvents,
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  })

  try {
    await waitFor(
      () =>
        fetch(base + '/health')
          .then((r) => r.ok)
          .catch(() => false),
      'Serverstart'
    )

    // [2] Job anlegen, Fortschritt verfolgen, Ergebnis abrufen
    let resp = await convert(base, { mode: 'job' })
    assert.strictEqual(resp.status, 202)
    const created = await resp.json()
    assert.ok(created.ok && /^[\w-]{16}$/.test(created.jobId), 'Job-ID')
    assert.strictEqual(created.events, '/api/jobs/' + created.jobId + '/events')

    const events = await readEvents(base + created.events)
    const percents = events.filter((e) => e.event === 'progress').map((e) => e.data.percent)
    assert.ok(percents.includes(25) && percents.includes(50) && percents.includes(75), percents)
    assert.deepStrictEqual(
      percents,
      [...percents].sort((a, b) => a - b),
      'Fortschritt steigt nur'
    )
    assert.ok(
      percents.every((p) => p < 100),
      'progress meldet höchstens 99 %'
    )
    const last = events[events.length - 1]
    assert.strictEqual(last.event, 'done')
    assert.ok(last.data.ok && last.data.url.startsWith('/files/') && last.data.size === 64)
    const file = await fetch(base + last.data.url)
    assert.strictEqual(file.status, 200)
    console.log('[2] Job mit Fortschritt', percents.join(' → '), '→ done')

    // [3] Später verbundener Client bekommt das Ergebnis sofort
    const again = await readEvents(base + created.events)
    assert.deepStrictEqual(
      again.map((e) => e.event),
      ['done']
    )
    console.log('[3] erneuter Abruf liefert sofort done')

    // [4] Abbruch per DELETE beendet ffmpeg, es bleibt keine Ausgabedatei
    const before = fs.readdirSync(filesDir).length
    const logBefore = stubLog().length
    const cancelJob = await (await convert(base, { mode: 'job' })).json()
    const cancelEvents = await readEvents(base + cancelJob.events, async (e) => {
      if (e.event === 'progress' && e.data.percent > 0) {
        const del = await fetch(base + '/api/jobs/' + cancelJob.jobId, { method: 'DELETE' })
        assert.strictEqual(del.status, 200)
      }
    })
    const end = cancelEvents[cancelEvents.length - 1]
    assert.strictEqual(end.event, 'failed')
    assert.deepStrictEqual(end.data, { ok: false, error: 'cancelled' })
    await sleep(600) // Stub wäre jetzt fertig, hätte er weitergelaufen
    assert.strictEqual(fs.readdirSync(filesDir).length, before, 'keine Datei nach Abbruch')
    assert.deepStrictEqual(
      stubLog()
        .slice(logBefore)
        .map((line) => line.split(' ')[0]),
      ['start'],
      'ffmpeg wurde beendet, bevor er fertig war'
    )
    assert.strictEqual((await (await fetch(base + '/health')).json()).ffmpeg.running, 0)
    const del2 = await fetch(base + '/api/jobs/' + cancelJob.jobId, { method: 'DELETE' })
    assert.strictEqual(del2.status, 409)
    console.log('[4] DELETE bricht ab, keine Ausgabedatei, zweites DELETE -> 409')

    // [5] Verbindet sich niemand, wird der Job abgebrochen
    const orphan = await (await convert(base, { mode: 'job' })).json()
    await sleep(800)
    const orphanEvents = await readEvents(base + orphan.events)
    assert.deepStrictEqual(orphanEvents, [
      { event: 'failed', data: { ok: false, error: 'job_orphaned' } },
    ])
    console.log('[5] verwaister Job wird abgebrochen')

    // [6] Unbekannte Jobs
    resp = await fetch(base + '/api/jobs/gibtesnicht0000/events')
    assert.strictEqual(resp.status, 404)
    resp = await fetch(base + '/api/jobs/gibtesnicht0000', { method: 'DELETE' })
    assert.strictEqual(resp.status, 404)
    console.log('[6] unbekannte Job-ID -> 404')

    // [7] Ohne mode=job bleibt die Antwort synchron wie bisher
    resp = await convert(base)
    assert.strictEqual(resp.status, 200)
    const sync = await resp.json()
    assert.ok(sync.ok && sync.url.startsWith('/files/') && !sync.jobId)
    console.log('[7] synchroner Modus unverändert')

    const h = await (await fetch(base + '/health')).json()
    assert.strictEqual(h.jobs.active, 0)
    assert.strictEqual(h.ffmpeg.running, 0)
    console.log('\nAlle Job-Checks bestanden.')
  } finally {
    server.kill()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
