/**
 * Audiokonverter — eigenständiges Backend
 * ========================================
 *
 * Ersetzt die Nutzung von /var/www/kodinitools.com/_backend_common/server.js.
 * Enthält ausschließlich, was die Oberfläche tatsächlich aufruft:
 *
 *   GET  /health          Statusprobe (nginx, Monitoring)
 *   GET  /files/<name>    Ergebnis herunterladen (statisch)
 *   POST /api/convert     Datei konvertieren (mit mode=job: sofort Job-ID, siehe jobs.js)
 *   GET  /api/jobs/:id/events  Fortschritt eines Jobs (Server-Sent Events)
 *   DELETE /api/jobs/:id  Job abbrechen
 *
 * Bewusst NICHT enthalten (steckte im gemeinsamen Backend, wurde hier nie
 * benutzt): Login/Auth, Playlists, Player-State, /api/tracks, /api/upload,
 * /api/files/*, der alte Async-Job-Modus (/api/job/:id) und der Konvertier-Zweig
 * über file_url. Der heutige Job-Modus (/api/jobs/:id) ist neu und dient nur dem
 * Fortschritt.
 * `GET /api/tracks` war ohne Auth erreichbar und gab Dateiname, Größe und URL
 * jeder Datei im FILES_DIR preis — also die Konvertierungen fremder Nutzer.
 *
 * Konfiguration (Umgebungsvariablen):
 *   PORT               Default 9000
 *   FILES_DIR          Ablage der Ergebnisse, Default <dieser Ordner>/files
 *   CONVERT_TTL_MS     Aufräumen alter Ergebnisse; Default 6 h.
 *                      0 schaltet das Aufräumen ab. Ein zu kurzer Wert kann
 *                      Download-Links brechen, die noch offen im Browser liegen.
 *   FFMPEG_TIMEOUT_MS  Default 120000
 *   MAX_UPLOAD_BYTES   Default 314572800 (300 MB)
 *   FFMPEG_MAX_CONCURRENT  Gleichzeitige ffmpeg-Prozesse; Default Anzahl CPU-Kerne
 *   FFMPEG_MAX_QUEUE   Wartende Konvertierungen, danach 503; Default 4 × MAX_CONCURRENT
 *   JOB_ORPHAN_MS      Job ohne verbundenen Client wird abgebrochen; Default 30000
 *   JOB_TTL_MS         Beendete Jobs bleiben abrufbar; Default 300000 (5 min)
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const multer = require('multer')
const { nanoid } = require('nanoid')
const { isAllowedFormat, qualityToBitrate, audioCodecArgs } = require('./codecArgs')
const { createJobStore, parseProgressSeconds, progressPercent } = require('./jobs')

const app = express()
app.disable('x-powered-by')

const PORT = Number(process.env.PORT) || 9000
const FILES_DIR = process.env.FILES_DIR || path.join(__dirname, 'files')
// Default: 6 h. Unset → aufräumen an; explizit 0 schaltet es ab.
const CONVERT_TTL_MS =
  process.env.CONVERT_TTL_MS !== undefined && process.env.CONVERT_TTL_MS !== ''
    ? Number(process.env.CONVERT_TTL_MS)
    : 6 * 60 * 60 * 1000
const FFMPEG_TIMEOUT_MS = Number(process.env.FFMPEG_TIMEOUT_MS) || 120000
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 300 * 1024 * 1024
// Die Oberfläche schickt bis zu 3 Dateien gleichzeitig. Mehr ffmpeg-Prozesse
// als Kerne machen jede einzelne Konvertierung nur langsamer.
const FFMPEG_MAX_CONCURRENT =
  Number(process.env.FFMPEG_MAX_CONCURRENT) || Math.max(1, os.cpus().length)
const FFMPEG_MAX_QUEUE =
  process.env.FFMPEG_MAX_QUEUE !== undefined && process.env.FFMPEG_MAX_QUEUE !== ''
    ? Number(process.env.FFMPEG_MAX_QUEUE)
    : FFMPEG_MAX_CONCURRENT * 4

// Die Audiodaten kommen als multipart und laufen hier vorbei; für alles andere
// reichen kleine Bodies.
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
})

// ---- Utils ----
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function safeUnlink(p) {
  try {
    fs.unlinkSync(p)
  } catch (_) {}
}

function sanitizeOutputName(base, wantedExt) {
  const cleanBase = String(base)
    .replace(/[^a-z0-9_\-.]+/gi, '_')
    .replace(/\.+/g, '.')
  const ext = (wantedExt || '').replace(/[^a-z0-9]/gi, '')
  return ext ? cleanBase + '.' + ext : cleanBase
}

// WebM ist ein Video-Container. Bei solchen Eingaben wird die Videospur
// verworfen (-vn); bei allen anderen bleibt z. B. eingebettetes Cover-Art erhalten.
function isWebmInput(file) {
  return (
    /\.(webm|weba)$/i.test(String(file.originalname || '')) ||
    /webm/i.test(String(file.mimetype || ''))
  )
}

function validateBitrate(br) {
  return typeof br === 'string' && /^[1-9]\d{1,3}k$/i.test(br)
}

function validateSampleRate(sr) {
  const n = Number(sr)
  return Number.isInteger(n) && n >= 8000 && n <= 192000
}

function validateChannels(ch) {
  const n = Number(ch)
  return Number.isInteger(n) && n >= 1 && n <= 8
}

/**
 * Startet ffmpeg. Mit `onProgress` wird `-progress pipe:1` gesetzt und die
 * bereits kodierte Zeit (Sekunden) gemeldet; mit `signal` lässt sich der
 * Prozess abbrechen (Fehler `job_cancelled`).
 */
function runFfmpeg(args, timeoutMs = FFMPEG_TIMEOUT_MS, { signal, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new Error('job_cancelled'))
    const progressArgs = onProgress ? ['-progress', 'pipe:1', '-nostats'] : []
    const ff = spawn('ffmpeg', ['-nostdin', ...progressArgs, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stderr = ''
    let stdoutRest = ''
    let killedByTimeout = false
    let killedByAbort = false

    const kill = () => {
      try {
        ff.kill('SIGKILL')
      } catch (_) {}
    }
    const timer = setTimeout(() => {
      killedByTimeout = true
      kill()
    }, timeoutMs)
    const onAbort = () => {
      killedByAbort = true
      kill()
    }
    if (signal) signal.addEventListener('abort', onAbort, { once: true })

    // stdout immer lesen: ein voller Pipe-Puffer würde ffmpeg blockieren
    ff.stdout.on('data', (d) => {
      if (!onProgress) return
      const lines = (stdoutRest + d.toString()).split('\n')
      stdoutRest = lines.pop()
      for (const line of lines) {
        const seconds = parseProgressSeconds(line)
        if (seconds !== null) onProgress(seconds)
      }
    })
    ff.stderr.on('data', (d) => (stderr += d.toString()))
    ff.on('error', (e) => {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
      reject(new Error('ffmpeg_spawn_failed: ' + e.message))
    })
    ff.on('close', (code) => {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
      if (killedByAbort) return reject(new Error('job_cancelled'))
      if (killedByTimeout) return reject(new Error('ffmpeg_timeout'))
      code === 0 ? resolve() : reject(new Error(stderr || 'ffmpeg_exit_' + code))
    })
  })
}

/** Dauer der Eingabe in Sekunden per ffprobe; null, wenn sie nicht ermittelbar ist. */
function probeDuration(file, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let out = ''
    let probe
    try {
      probe = spawn(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
    } catch (_) {
      return resolve(null)
    }
    const timer = setTimeout(() => {
      try {
        probe.kill('SIGKILL')
      } catch (_) {}
    }, timeoutMs)
    probe.stdout.on('data', (d) => (out += d.toString()))
    probe.on('error', () => {
      clearTimeout(timer)
      resolve(null)
    })
    probe.on('close', (code) => {
      clearTimeout(timer)
      const seconds = Number.parseFloat(out.trim())
      resolve(code === 0 && seconds > 0 ? seconds : null)
    })
  })
}

// ---- Begrenzung gleichzeitiger ffmpeg-Prozesse ----
// Ist kein Platz frei, wartet die Anfrage in einer FIFO-Schlange. Ist auch die
// voll, gibt es sofort 503 (server_busy). Bricht der Client ab, solange er noch
// wartet, wird er aus der Schlange genommen und belegt keinen Platz mehr.
let ffmpegRunning = 0
const ffmpegWaiting = []

function acquireFfmpegSlot(signal) {
  if (signal && signal.aborted) return Promise.reject(new Error('client_closed'))
  if (ffmpegRunning < FFMPEG_MAX_CONCURRENT) {
    ffmpegRunning++
    return Promise.resolve()
  }
  if (ffmpegWaiting.length >= FFMPEG_MAX_QUEUE) {
    return Promise.reject(new Error('server_busy'))
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      const i = ffmpegWaiting.indexOf(entry)
      if (i !== -1) ffmpegWaiting.splice(i, 1)
      reject(new Error('client_closed'))
    }
    const entry = {
      start() {
        if (signal) signal.removeEventListener('abort', onAbort)
        resolve()
      },
    }
    if (signal) signal.addEventListener('abort', onAbort, { once: true })
    ffmpegWaiting.push(entry)
  })
}

function ffmpegQueueFull() {
  return ffmpegRunning >= FFMPEG_MAX_CONCURRENT && ffmpegWaiting.length >= FFMPEG_MAX_QUEUE
}

function releaseFfmpegSlot() {
  const next = ffmpegWaiting.shift()
  if (next) {
    // Platz direkt weitergeben: ffmpegRunning bleibt gleich
    next.start()
  } else {
    ffmpegRunning--
  }
}

// Endungen, die der Sweeper aufräumen darf — genau die Zielformate. So bleibt
// alles Nicht-Audio (z. B. versehentlich abgelegte Dateien) unangetastet, selbst
// wenn FILES_DIR wider Erwarten geteilt würde.
const CONVERT_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.ogg',
  '.m4a',
  '.wma',
  '.opus',
  '.aiff',
])

ensureDir(FILES_DIR)

const JOB_ORPHAN_MS = Number(process.env.JOB_ORPHAN_MS) || 30000
const JOB_TTL_MS = Number(process.env.JOB_TTL_MS) || 5 * 60 * 1000
const jobs = createJobStore({ newId: () => nanoid(16), orphanMs: JOB_ORPHAN_MS, ttlMs: JOB_TTL_MS })

// ---- Routen ----

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    port: PORT,
    filesDir: FILES_DIR,
    service: 'audiokonverter',
    ffmpeg: {
      running: ffmpegRunning,
      queued: ffmpegWaiting.length,
      maxConcurrent: FFMPEG_MAX_CONCURRENT,
      maxQueue: FFMPEG_MAX_QUEUE,
    },
    jobs: jobs.stats(),
  })
)

// Ergebnis herunterladen. Kein Verzeichnis-Listing; die Namen tragen eine
// nanoid und sind damit nicht erratbar.
app.use('/files', express.static(FILES_DIR, { index: false, dotfiles: 'deny' }))
app.use('/files', (_req, res) => res.status(404).json({ ok: false, error: 'file_not_found' }))

/** Konvertierung im Job-Modus: läuft nach der 202-Antwort weiter und meldet Fortschritt. */
async function runJob(job, conv) {
  const { signal } = job.abort
  try {
    await acquireFfmpegSlot(signal)
    try {
      if (signal.aborted) throw new Error('job_cancelled')
      jobs.setStatus(job, 'running')
      const duration = await probeDuration(conv.inputPath)
      console.log('[convert start]', { ...conv.log, job: job.id, duration })
      await runFfmpeg(conv.args, FFMPEG_TIMEOUT_MS, {
        signal,
        onProgress: (seconds) => jobs.setPercent(job, progressPercent(seconds, duration)),
      })
    } finally {
      releaseFfmpegSlot()
    }
    const stats = fs.statSync(conv.outPath)
    console.log('[convert ok]', conv.outName, stats.size + 'B', 'job=' + job.id)
    jobs.finish(job, 'done', {
      ok: true,
      url: '/files/' + conv.outName,
      filename: conv.outName,
      format: conv.fmt,
      size: stats.size,
    })
  } catch (e) {
    if (signal.aborted) {
      console.log('[convert cancelled] job=' + job.id)
      safeUnlink(conv.outPath)
    } else {
      console.error('[convert err]', e.message, 'job=' + job.id)
      jobs.finish(job, 'failed', { ok: false, error: e.message })
    }
  } finally {
    if (fs.existsSync(conv.inputPath)) safeUnlink(conv.inputPath)
  }
}

app.post('/api/convert', upload.single('file'), async (req, res) => {
  let inputOwnedByJob = false
  try {
    if (!req.file) throw new Error('no_input')

    const fmt = String(req.body.format || '').toLowerCase()
    if (!isAllowedFormat(fmt)) throw new Error('bad_format')

    const quality = req.body.quality ? Math.max(1, Math.min(10, Number(req.body.quality))) : null
    const bitrate = req.body.bitrate || (quality ? qualityToBitrate(quality, fmt) : null)
    const { samplerate, channels } = req.body
    const normalize = String(req.body.normalize || 'false').toLowerCase() === 'true'

    if (bitrate && !validateBitrate(bitrate)) throw new Error('bad_bitrate')
    if (samplerate && !validateSampleRate(samplerate)) throw new Error('bad_samplerate')
    if (channels && !validateChannels(channels)) throw new Error('bad_channels')

    const base = (path.parse(req.file.originalname || 'audio').name || 'audio').replace(
      /[^a-z0-9_\-.]+/gi,
      '_'
    )
    const outName = sanitizeOutputName(base + '-' + nanoid(6), fmt)
    const outPath = path.join(FILES_DIR, outName)

    const args = ['-y', '-i', req.file.path]
    if (isWebmInput(req.file)) args.push('-vn')
    if (samplerate) args.push('-ar', String(samplerate))
    if (channels) args.push('-ac', String(channels))
    if (normalize) args.push('-filter:a', 'loudnorm=I=-16:TP=-1.5:LRA=11')
    args.push(...audioCodecArgs(fmt, bitrate, quality), outPath)

    // Job-Modus: sofort mit Job-ID antworten, Fortschritt über
    // GET /api/jobs/:id/events. Ohne mode=job bleibt die Antwort synchron.
    if (String(req.body.mode || '').toLowerCase() === 'job') {
      if (ffmpegQueueFull()) throw new Error('server_busy')
      const job = jobs.create()
      inputOwnedByJob = true
      runJob(job, {
        inputPath: req.file.path,
        args,
        outName,
        outPath,
        fmt,
        log: { fmt, bitrate, samplerate, channels, normalize, out: outName },
      })
      return res.status(202).json({
        ok: true,
        jobId: job.id,
        events: '/api/jobs/' + job.id + '/events',
      })
    }

    // Bricht der Client ab, solange die Anfrage noch auf einen Platz wartet,
    // gibt sie ihn nicht erst nach einer nutzlosen Konvertierung frei.
    const clientGone = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) clientGone.abort()
    })
    await acquireFfmpegSlot(clientGone.signal)
    console.log('[convert start]', { fmt, bitrate, samplerate, channels, normalize, out: outName })
    try {
      await runFfmpeg(args)
    } finally {
      releaseFfmpegSlot()
    }

    const stats = fs.statSync(outPath)

    console.log('[convert ok]', outName, stats.size + 'B')
    res.json({
      ok: true,
      url: '/files/' + outName,
      filename: outName,
      format: fmt,
      size: stats.size,
    })
  } catch (e) {
    if (e.message === 'client_closed') {
      console.log('[convert cancelled] Client hat vor dem Start abgebrochen')
      return
    }
    console.error('[convert err]', e.message)
    const code =
      e.message === 'ffmpeg_timeout'
        ? 504
        : e.message === 'server_busy'
          ? 503
          : e.message.startsWith('bad_')
            ? 400
            : 500
    res.status(code).json({ ok: false, error: e.message })
  } finally {
    if (!inputOwnedByJob && req.file && fs.existsSync(req.file.path)) safeUnlink(req.file.path)
  }
})

app.get('/api/jobs/:id/events', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ ok: false, error: 'job_not_found' })
  jobs.subscribe(job, req, res)
})

app.delete('/api/jobs/:id', (req, res) => {
  if (!jobs.get(req.params.id)) return res.status(404).json({ ok: false, error: 'job_not_found' })
  if (!jobs.cancel(req.params.id)) return res.status(409).json({ ok: false, error: 'job_finished' })
  res.json({ ok: true })
})

// Aufräumen alter Ergebnisse. Standardmäßig an (Default 6 h), abschaltbar über
// CONVERT_TTL_MS=0. Geht direkt über FILES_DIR statt über eine Prozessliste,
// damit auch Dateien aus früheren Läufen und Altbestände erfasst werden. Nur
// Audio-Ergebnisse (CONVERT_EXTENSIONS) werden berührt.
function sweepConvertedOutputs() {
  const now = Date.now()
  let removed = 0
  try {
    for (const name of fs.readdirSync(FILES_DIR)) {
      if (!CONVERT_EXTENSIONS.has(path.extname(name).toLowerCase())) continue
      const full = path.join(FILES_DIR, name)
      try {
        const stats = fs.statSync(full)
        if (stats.isFile() && now - stats.mtimeMs >= CONVERT_TTL_MS) {
          safeUnlink(full)
          removed++
          console.log('[convert sweep]', name)
        }
      } catch (_) {}
    }
  } catch (e) {
    console.error('[convert sweep err]', e.message)
  }
  return removed
}

if (CONVERT_TTL_MS > 0) {
  sweepConvertedOutputs() // beim Start liegengebliebene Ergebnisse aufräumen
  const sweepTimer = setInterval(sweepConvertedOutputs, 5 * 60 * 1000)
  if (typeof sweepTimer.unref === 'function') sweepTimer.unref()
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(
    'Audiokonverter Backend auf http://127.0.0.1:' + PORT + ' (FILES_DIR=' + FILES_DIR + ')'
  )
  // ecosystem.config.js setzt wait_ready: true — ohne dieses Signal wartet pm2
  // beim Start unnötig bis zum listen_timeout.
  if (typeof process.send === 'function') process.send('ready')
})
