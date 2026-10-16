/**
 * Arbeitet `items` mit höchstens `limit` gleichzeitig laufenden Aufgaben ab,
 * in Listenreihenfolge. Nach einem Abbruch über `signal` startet keine neue
 * Aufgabe mehr; bereits laufende werden abgewartet (sie reagieren selbst auf
 * das Signal).
 */
export async function runPool<T>(
  items: readonly T[],
  limit: number,
  signal: AbortSignal,
  task: (item: T) => Promise<unknown>
): Promise<void> {
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < items.length && !signal.aborted) {
      const item = items[next++]
      await task(item)
    }
  }
  const workers = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: workers }, worker))
}
