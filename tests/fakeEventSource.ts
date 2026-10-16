/** EventSource-Ersatz für jsdom: Tests senden Server-Ereignisse von Hand. */
export class FakeEventSource {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  static instances: FakeEventSource[] = []

  readyState = FakeEventSource.OPEN
  onerror: ((event: Event) => void) | null = null
  private listeners = new Map<string, Set<(event: Event) => void>>()

  constructor(public url: string) {
    FakeEventSource.instances.push(this)
  }

  static last(): FakeEventSource {
    const source = FakeEventSource.instances[FakeEventSource.instances.length - 1]
    if (!source) throw new Error('Keine EventSource geöffnet')
    return source
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)?.add(listener)
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener)
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED
  }

  /** Server-Ereignis wie `event: <type>\ndata: <json>`. */
  emit(type: string, data: unknown): void {
    const event = new MessageEvent(type, {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    })
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }

  /** Verbindungsfehler; `readyState` CONNECTING = Browser verbindet neu, CLOSED = endgültig. */
  fail(readyState: number = FakeEventSource.CONNECTING): void {
    this.readyState = readyState
    this.onerror?.(new Event('error'))
  }
}
