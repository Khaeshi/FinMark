/**
 * In-memory data cache for JIT hover-prefetching.
 *
 * When the sidebar detects real hover intent (see useHoverIntent), it warms
 * this cache with the target page's data. The page's own data hook checks
 * here first on mount — a hit means the page renders instantly with no
 * skeleton; a miss falls back to the normal fetch + skeleton flow.
 *
 * Deliberately dependency-free (no SWR/React Query) — this is a small,
 * single-purpose cache, not a general data layer.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const TTL_MS = 30_000 // matches the ~30s freshness window the dashboard already assumes

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() })
}

export function invalidateCached(key: string): void {
  store.delete(key)
}
