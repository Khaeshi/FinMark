'use client'
import { useRef, useCallback } from 'react'

/**
 * Fires `onIntent` only if the pointer stays over the element for at least
 * `delayMs`. A quick pass-over (cursor just crossing the sidebar on its way
 * elsewhere) never reaches the timeout, so it never fires — this is what
 * keeps the JIT prefetch from firing on every stray hover.
 *
 * delayMs defaults to 70ms, inside the 65–80ms window: long enough to filter
 * out incidental hovers, short enough that a genuinely-aimed hover still
 * has time to prefetch before the click lands.
 */
export function useHoverIntent(onIntent: () => void, delayMs: number = 70) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onMouseEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onIntent()
    }, delayMs)
  }, [onIntent, delayMs])

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // touch devices have no hover — fire immediately on the tap-equivalent
  // so mobile/tablet users aren't penalized, they just skip the delay logic
  const onTouchStart = useCallback(() => {
    onIntent()
  }, [onIntent])

  return { onMouseEnter, onMouseLeave, onTouchStart }
}
