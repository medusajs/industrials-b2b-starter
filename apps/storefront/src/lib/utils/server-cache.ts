const MAX_ENTRIES = 500

type Entry = { freshUntil: number; staleUntil: number; value: Promise<unknown>; refreshing: boolean }

const entries = new Map<string, Entry>()

const store = (key: string, entry: Entry) => {
  if (!entries.has(key) && entries.size >= MAX_ENTRIES) {
    entries.delete(entries.keys().next().value!)
  }
  entries.set(key, entry)
}

/**
 * Memoizes `fetcher` per key on the server so SSR requests don't repeat
 * identical backend calls. Within `staleMs` after `ttlMs` expires, the stale
 * value is returned immediately while one background call refreshes it.
 * In the browser it calls `fetcher` directly.
 */
export const cachedOnServer = <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  staleMs = 0
): Promise<T> => {
  if (typeof window !== "undefined") return fetcher()

  const now = Date.now()
  const hit = entries.get(key)
  if (hit && hit.freshUntil > now) return hit.value as Promise<T>

  const load = () => {
    const value = fetcher()
    value.then(
      () =>
        store(key, {
          freshUntil: Date.now() + ttlMs,
          staleUntil: Date.now() + ttlMs + staleMs,
          value,
          refreshing: false,
        }),
      () => {
        if (entries.get(key)?.value === value) entries.delete(key)
      }
    )
    return value
  }

  if (hit && hit.staleUntil > now) {
    if (!hit.refreshing) {
      hit.refreshing = true
      load().catch(() => {
        hit.refreshing = false
      })
    }
    return hit.value as Promise<T>
  }

  const value = load()
  store(key, { freshUntil: now + ttlMs, staleUntil: now + ttlMs + staleMs, value, refreshing: false })
  return value
}
