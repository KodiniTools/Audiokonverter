// @ts-check
/**
 * Konvertier-Jobs mit Fortschritt per Server-Sent Events.
 *
 * Ablauf: POST /api/convert mit mode=job legt einen Job an und antwortet sofort
 * mit der Job-ID. GET /api/jobs/:id/events streamt `progress`
 * ({ status, percent }), am Ende `done` (wie die synchrone Antwort) oder
 * `failed` ({ ok: false, error }). DELETE /api/jobs/:id bricht ab.
 *
 * Ein Job ohne Zuhörer wird nach `orphanMs` abgebrochen: Der Client hat sich
 * nie verbunden oder ist weg. Eine kurze Unterbrechung mit automatischem
 * Reconnect des EventSource überlebt der Job damit. Beendete Jobs bleiben
 * `ttlMs` lang abrufbar, damit ein spät verbundener Client das Ergebnis erhält.
 */

/** @typedef {'queued' | 'running' | 'done' | 'failed' | 'cancelled'} JobStatus */

/**
 * Inhalt des `done`- bzw. `failed`-Ereignisses.
 *
 * @typedef {{ ok: true, url: string, filename: string, format: string, size: number }
 *   | { ok: false, error: string }} JobResult
 */

/**
 * @typedef {object} Job
 * @property {string} id
 * @property {JobStatus} status
 * @property {number} percent 0–99, nur steigend
 * @property {JobResult | null} result gesetzt, sobald der Job beendet ist
 * @property {Set<import('http').ServerResponse>} listeners offene SSE-Antworten
 * @property {AbortController} abort
 * @property {NodeJS.Timeout | null} orphanTimer
 */

/** @type {ReadonlySet<JobStatus>} */
const FINAL = new Set(/** @type {const} */ (['done', 'failed', 'cancelled']))

/**
 * Sekunden aus einer Zeile von `ffmpeg -progress` (out_time_us bzw. out_time_ms, beide µs).
 *
 * @param {string} line
 * @returns {number | null}
 */
function parseProgressSeconds(line) {
  const match = /^out_time_(?:us|ms)=(\d+)\s*$/.exec(line)
  return match ? Number(match[1]) / 1e6 : null
}

/**
 * Fortschritt 0–99 %; 100 % meldet erst das `done`-Ereignis.
 *
 * @param {number} seconds
 * @param {number | null} durationSeconds
 * @returns {number | null}
 */
function progressPercent(seconds, durationSeconds) {
  if (durationSeconds === null || !(durationSeconds > 0) || !(seconds >= 0)) return null
  return Math.min(99, Math.floor((seconds / durationSeconds) * 100))
}

/**
 * @param {string} event
 * @param {unknown} data
 * @returns {string}
 */
function sseFrame(event, data) {
  return 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n'
}

/**
 * @param {object} options
 * @param {() => string} options.newId
 * @param {number} [options.orphanMs] Job ohne Zuhörer wird danach abgebrochen
 * @param {number} [options.ttlMs] Beendete Jobs bleiben so lange abrufbar
 * @param {number} [options.heartbeatMs] Abstand der SSE-Kommentarzeilen
 */
function createJobStore({ newId, orphanMs = 30000, ttlMs = 5 * 60 * 1000, heartbeatMs = 15000 }) {
  /** @type {Map<string, Job>} */
  const jobs = new Map()

  /** @param {Job} job */
  function finalFrame(job) {
    return job.status === 'done' ? sseFrame('done', job.result) : sseFrame('failed', job.result)
  }

  /** @param {Job} job */
  function armOrphanTimer(job) {
    clearTimeout(job.orphanTimer ?? undefined)
    const timer = setTimeout(() => cancel(job.id, 'job_orphaned'), orphanMs)
    if (typeof timer.unref === 'function') timer.unref()
    job.orphanTimer = timer
  }

  /** @returns {Job} */
  function create() {
    /** @type {Job} */
    const job = {
      id: newId(),
      status: 'queued',
      percent: 0,
      result: null,
      listeners: new Set(),
      abort: new AbortController(),
      orphanTimer: null,
    }
    jobs.set(job.id, job)
    armOrphanTimer(job)
    return job
  }

  /**
   * @param {string} id
   * @returns {Job | null}
   */
  function get(id) {
    return jobs.get(id) || null
  }

  /**
   * @param {Job} job
   * @param {string} frame
   */
  function broadcast(job, frame) {
    for (const res of job.listeners) res.write(frame)
  }

  /**
   * @param {Job} job
   * @param {JobStatus} status
   */
  function setStatus(job, status) {
    if (FINAL.has(job.status) || job.status === status) return
    job.status = status
    broadcast(job, sseFrame('progress', { status, percent: job.percent }))
  }

  /**
   * Nur steigende, ganzzahlige Werte senden: ffmpeg meldet mehrmals pro Sekunde.
   *
   * @param {Job} job
   * @param {number | null} percent
   */
  function setPercent(job, percent) {
    if (FINAL.has(job.status) || percent === null || percent <= job.percent) return
    job.percent = percent
    broadcast(job, sseFrame('progress', { status: job.status, percent }))
  }

  /**
   * @param {Job} job
   * @param {'done' | 'failed' | 'cancelled'} status
   * @param {JobResult} result
   */
  function finish(job, status, result) {
    if (FINAL.has(job.status)) return
    job.status = status
    job.result = result
    clearTimeout(job.orphanTimer ?? undefined)
    const frame = finalFrame(job)
    for (const res of job.listeners) res.end(frame)
    job.listeners.clear()
    const ttl = setTimeout(() => jobs.delete(job.id), ttlMs)
    if (typeof ttl.unref === 'function') ttl.unref()
  }

  /**
   * Bricht einen laufenden oder wartenden Job ab; false, wenn er unbekannt oder fertig ist.
   *
   * @param {string} id
   * @param {string} [reason]
   * @returns {boolean}
   */
  function cancel(id, reason = 'cancelled') {
    const job = jobs.get(id)
    if (!job || FINAL.has(job.status)) return false
    job.abort.abort(new Error(reason))
    finish(job, 'cancelled', { ok: false, error: reason })
    return true
  }

  /**
   * Hängt eine SSE-Antwort an den Job und schickt sofort den aktuellen Stand.
   *
   * @param {Job} job
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  function subscribe(job, req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // nginx puffert Antworten sonst und liefert den Fortschritt erst am Ende
      'X-Accel-Buffering': 'no',
    })
    res.write('retry: 3000\n\n')
    if (FINAL.has(job.status)) return res.end(finalFrame(job))

    res.write(sseFrame('progress', { status: job.status, percent: job.percent }))
    job.listeners.add(res)
    clearTimeout(job.orphanTimer ?? undefined)

    // Kommentarzeilen halten die Verbindung durch Proxys mit Lese-Timeout offen
    const heartbeat = setInterval(() => res.write(': ping\n\n'), heartbeatMs)
    if (typeof heartbeat.unref === 'function') heartbeat.unref()
    req.on('close', () => {
      clearInterval(heartbeat)
      job.listeners.delete(res)
      if (!FINAL.has(job.status) && job.listeners.size === 0) armOrphanTimer(job)
    })
  }

  function stats() {
    let active = 0
    for (const job of jobs.values()) if (!FINAL.has(job.status)) active++
    return { active, total: jobs.size }
  }

  return { create, get, setStatus, setPercent, finish, cancel, subscribe, stats }
}

module.exports = { createJobStore, parseProgressSeconds, progressPercent, sseFrame }
