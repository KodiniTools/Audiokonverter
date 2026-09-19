/**
 * Audiokonverter — eigenständiges Backend
 * ========================================
 *
 * Ersetzt die Nutzung von /var/www/kodinitools.com/_backend_common/server.js.
 * Enthält ausschließlich, was die Oberfläche tatsächlich aufruft:
 *
 *   GET  /health          Statusprobe (nginx, Monitoring)
 *   GET  /files/<name>    Ergebnis herunterladen (statisch)
 *   POST /api/convert     Datei konvertieren
 *
 * Bewusst NICHT enthalten (steckte im gemeinsamen Backend, wurde hier nie
 * benutzt): Login/Auth, Playlists, Player-State, /api/tracks, /api/upload,
 * /api/files/*, der Async-Job-Modus und der Konvertier-Zweig über file_url.
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
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const multer = require('multer')
const { nanoid } = require('nanoid')

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

function isAllowedFormat(fmt) {
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'].includes(
    String(fmt || '').toLowerCase()
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

function qualityToBitrate(quality, format) {
  const q = Math.max(1, Math.min(10, Number(quality) || 5))
  if (format === 'opus') {
    const rates = [32, 48, 64, 96, 128, 160, 192, 256, 320, 510]
    return (rates[q - 1] || 128) + 'k'
  }
  const rates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
  return (rates[q - 1] || 192) + 'k'
}

/** Codec-Argumente je Zielformat. Identisch zum gemeinsamen Backend. */
function audioCodecArgs(fmt, bitrate, quality) {
  switch (fmt) {
    case 'mp3':
      return ['-codec:a', 'libmp3lame', '-b:a', bitrate || '192k']
    case 'aac':
      return ['-codec:a', 'aac', '-b:a', bitrate || '192k']
    case 'm4a':
      return ['-vn', '-codec:a', 'aac', '-b:a', bitrate || '192k', '-movflags', '+faststart']
    case 'ogg':
      return quality
        ? ['-codec:a', 'libvorbis', '-q:a', String(quality)]
        : ['-codec:a', 'libvorbis', '-b:a', bitrate || '192k']
    case 'flac': {
      const comprLevel = quality ? Math.min(8, Math.max(0, quality - 2)) : 5
      return ['-codec:a', 'flac', '-compression_level', String(comprLevel)]
    }
    case 'wav': {
      const codec =
        quality && quality > 7 ? 'pcm_f32le' : quality && quality > 4 ? 'pcm_s24le' : 'pcm_s16le'
      return ['-codec:a', codec]
    }
    case 'wma':
      return ['-codec:a', 'wmav2', '-b:a', bitrate || '192k']
    case 'opus':
      return ['-codec:a', 'libopus', '-b:a', bitrate || '128k']
    case 'aiff': {
      const codec =
        quality && quality > 7 ? 'pcm_s32be' : quality && quality > 4 ? 'pcm_s24be' : 'pcm_s16be'
      return ['-codec:a', codec]
    }
    default:
      return []
  }
}

function runFfmpeg(args, timeoutMs = FFMPEG_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-nostdin', ...args], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    let killedByTimeout = false

    const timer = setTimeout(() => {
      killedByTimeout = true
      try {
        ff.kill('SIGKILL')
      } catch (_) {}
    }, timeoutMs)

    ff.stderr.on('data', (d) => (stderr += d.toString()))
    ff.on('error', (e) => {
      clearTimeout(timer)
      reject(new Error('ffmpeg_spawn_failed: ' + e.message))
    })
    ff.on('close', (code) => {
      clearTimeout(timer)
      if (killedByTimeout) return reject(new Error('ffmpeg_timeout'))
      code === 0 ? resolve() : reject(new Error(stderr || 'ffmpeg_exit_' + code))
    })
  })
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

// ---- Routen ----

app.get('/health', (_req, res) =>
  res.json({ ok: true, port: PORT, filesDir: FILES_DIR, service: 'audiokonverter' })
)

// Ergebnis herunterladen. Kein Verzeichnis-Listing; die Namen tragen eine
// nanoid und sind damit nicht erratbar.
app.use('/files', express.static(FILES_DIR, { index: false, dotfiles: 'deny' }))
app.use('/files', (_req, res) => res.status(404).json({ ok: false, error: 'file_not_found' }))

app.post('/api/convert', upload.single('file'), async (req, res) => {
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
    if (samplerate) args.push('-ar', String(samplerate))
    if (channels) args.push('-ac', String(channels))
    if (normalize) args.push('-filter:a', 'loudnorm=I=-16:TP=-1.5:LRA=11')
    args.push(...audioCodecArgs(fmt, bitrate, quality), outPath)

    console.log('[convert start]', { fmt, bitrate, samplerate, channels, normalize, out: outName })
    await runFfmpeg(args)

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
    console.error('[convert err]', e.message)
    const code = e.message === 'ffmpeg_timeout' ? 504 : e.message.startsWith('bad_') ? 400 : 500
    res.status(code).json({ ok: false, error: e.message })
  } finally {
    if (req.file && fs.existsSync(req.file.path)) safeUnlink(req.file.path)
  }
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
  console.log('Audiokonverter Backend auf http://127.0.0.1:' + PORT + ' (FILES_DIR=' + FILES_DIR + ')')
  // ecosystem.config.js setzt wait_ready: true — ohne dieses Signal wartet pm2
  // beim Start unnötig bis zum listen_timeout.
  if (typeof process.send === 'function') process.send('ready')
})
