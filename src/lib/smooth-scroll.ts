import Lenis from 'lenis'

let lenis: Lenis | null = null
let pauses = 0

/** Starts inertia scrolling unless the visitor prefers reduced motion. */
export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.085,
    wheelMultiplier: 0.95,
    // Touch keeps the platform's own momentum; it already feels native.
    syncTouch: false,
    anchors: false,
    prevent: (node) => node.closest('[role="dialog"]') !== null,
  })
  if (pauses > 0) lenis.stop()
  return () => {
    lenis?.destroy()
    lenis = null
  }
}

export function getLenis() {
  return lenis
}

/** Counted, so the loader and the work panel can each pause without fighting. */
export function pauseScroll(paused: boolean) {
  pauses = Math.max(0, pauses + (paused ? 1 : -1))
  const stop = pauses > 0
  document.documentElement.style.overflow = stop ? 'hidden' : ''
  if (!lenis) return
  if (stop) lenis.stop()
  else lenis.start()
}
