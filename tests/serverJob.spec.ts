/**
 * serverJob: Verfolgen einer Server-Konvertierung per Server-Sent Events und
 * Abbruch des Jobs. EventSource und fetch sind ersetzt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_RECONNECTS, cancelServerJob, followServerJob, isServerJob } from '@/services/serverJob'
import { FakeEventSource } from './fakeEventSource'

const fetchMock = vi.fn(() => Promise.resolve(new Response(null)))

beforeEach(() => {
  FakeEventSource.instances = []
  fetchMock.mockClear()
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('followServerJob', () => {
  it('verbindet sich mit dem Ereignis-Stream des Jobs', () => {
    void followServerJob('abc_-123', () => {})
    expect(FakeEventSource.last().url).toBe('/audiokonverter/api/jobs/abc_-123/events')
  })

  it('meldet den Fortschritt und liefert am Ende das Ergebnis', async () => {
    const onProgress = vi.fn()
    const result = followServerJob('job1', onProgress)
    const source = FakeEventSource.last()

    source.emit('progress', { status: 'queued', percent: 0 })
    source.emit('progress', { status: 'running', percent: 42 })
    source.emit('progress', { status: 'running', percent: 140 })
    source.emit('progress', { status: 'running' })
    source.emit('done', { ok: true, url: '/files/a.mp3', filename: 'a.mp3', size: 9 })

    await expect(result).resolves.toEqual({
      ok: true,
      url: '/files/a.mp3',
      filename: 'a.mp3',
      size: 9,
    })
    expect(onProgress.mock.calls).toEqual([[0], [42], [100]])
    expect(source.readyState).toBe(FakeEventSource.CLOSED)
  })

  it('endet mit der Fehlermeldung des Servers', async () => {
    const result = followServerJob('job1', () => {})
    FakeEventSource.last().emit('failed', { ok: false, error: 'ffmpeg_timeout' })
    await expect(result).rejects.toThrow('ffmpeg_timeout')
    expect(FakeEventSource.last().readyState).toBe(FakeEventSource.CLOSED)
  })

  it('schließt den Stream beim Abbruch und endet mit AbortError', async () => {
    const controller = new AbortController()
    const result = followServerJob('job1', () => {}, controller.signal)
    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    expect(FakeEventSource.last().readyState).toBe(FakeEventSource.CLOSED)
  })

  it('öffnet bei bereits abgebrochenem Signal keinen Stream', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(followServerJob('job1', () => {}, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(FakeEventSource.instances).toHaveLength(0)
  })

  it('gibt auf, wenn der Server den Stream ablehnt (z. B. Job unbekannt)', async () => {
    const result = followServerJob('job1', () => {})
    FakeEventSource.last().fail(FakeEventSource.CLOSED)
    await expect(result).rejects.toThrow('job_connection_lost')
  })

  it('übersteht kurze Verbindungsabbrüche, gibt nach zu vielen in Folge auf', async () => {
    const result = followServerJob('job1', () => {})
    const source = FakeEventSource.last()
    let settled = false
    result.catch(() => {}).finally(() => (settled = true))

    for (let i = 0; i < MAX_RECONNECTS; i++) source.fail()
    source.emit('progress', { percent: 10 }) // Ereignis setzt den Zähler zurück
    for (let i = 0; i < MAX_RECONNECTS; i++) source.fail()
    await Promise.resolve()
    expect(settled).toBe(false)

    source.fail()
    await expect(result).rejects.toThrow('job_connection_lost')
  })
})

describe('cancelServerJob', () => {
  it('schickt DELETE an den Job', () => {
    cancelServerJob('job1')
    expect(fetchMock).toHaveBeenCalledWith('/audiokonverter/api/jobs/job1', {
      method: 'DELETE',
      keepalive: true,
    })
  })

  it('verschluckt Netzfehler', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    expect(() => cancelServerJob('job1')).not.toThrow()
    await Promise.resolve()
  })
})

describe('isServerJob', () => {
  it.each([
    [{ ok: true, jobId: 'x', events: '/api/jobs/x/events' }, true],
    [{ ok: true, url: '/files/a.mp3', filename: 'a.mp3' }, false],
    [{ ok: false, error: 'bad_format' }, false],
    [null, false],
  ])('%j → %s', (data, expected) => {
    expect(isServerJob(data)).toBe(expected)
  })
})
