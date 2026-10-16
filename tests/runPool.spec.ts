import { describe, expect, it } from 'vitest'
import { runPool } from '@/utils/runPool'

/** Aufgabe, die erst endet, wenn der Test sie freigibt. */
function deferredTasks() {
  const started: number[] = []
  const release = new Map<number, () => void>()
  let running = 0
  let maxRunning = 0
  const task = (n: number) =>
    new Promise<void>((resolve) => {
      started.push(n)
      running++
      maxRunning = Math.max(maxRunning, running)
      release.set(n, () => {
        running--
        resolve()
      })
    })
  return {
    task,
    started,
    finish: (n: number) => release.get(n)?.(),
    get maxRunning() {
      return maxRunning
    },
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('runPool', () => {
  it('hält die Grenze ein und startet in Listenreihenfolge nach', async () => {
    const t = deferredTasks()
    const done = runPool([1, 2, 3, 4, 5], 2, new AbortController().signal, t.task)
    await tick()
    expect(t.started).toEqual([1, 2])

    t.finish(2)
    await tick()
    expect(t.started).toEqual([1, 2, 3])

    for (const n of [1, 3, 4, 5]) {
      t.finish(n)
      await tick()
    }
    await done
    expect(t.started).toEqual([1, 2, 3, 4, 5])
    expect(t.maxRunning).toBe(2)
  })

  it('startet nach einem Abbruch nichts Neues, wartet aber laufende ab', async () => {
    const t = deferredTasks()
    const controller = new AbortController()
    let finished = false
    const done = runPool([1, 2, 3, 4], 2, controller.signal, t.task).then(() => (finished = true))
    await tick()

    controller.abort()
    t.finish(1)
    await tick()
    expect(t.started).toEqual([1, 2])
    expect(finished).toBe(false)

    t.finish(2)
    await done
    expect(t.started).toEqual([1, 2])
  })

  it('kommt mit leerer Liste und Grenze 1 zurecht', async () => {
    const t = deferredTasks()
    await runPool([], 3, new AbortController().signal, t.task)
    expect(t.started).toEqual([])

    const done = runPool(
      ['a', 'b'].map((_, i) => i),
      1,
      new AbortController().signal,
      t.task
    )
    await tick()
    expect(t.started).toEqual([0])
    t.finish(0)
    await tick()
    t.finish(1)
    await done
    expect(t.maxRunning).toBe(1)
  })
})
