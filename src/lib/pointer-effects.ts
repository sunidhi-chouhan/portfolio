/**
 * Delegated pointer effects, one listener for the whole page:
 *  - [data-spotlight]: a soft moonlight glow follows the pointer inside the element
 *    (CSS reads --mx / --my).
 *  - [data-tilt]: the element leans a few degrees toward the pointer
 *    (CSS reads --rx / --ry).
 * Mouse and trackpad only, and nothing under reduced motion.
 */
export function startPointerEffects() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  let tilted: HTMLElement | null = null

  const onMove = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return

    const spot = target.closest<HTMLElement>('[data-spotlight]')
    if (spot) {
      const rect = spot.getBoundingClientRect()
      spot.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      spot.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }

    const tilt = target.closest<HTMLElement>('[data-tilt]')
    if (tilted && tilted !== tilt) reset(tilted)
    tilted = tilt
    if (tilt) {
      const rect = tilt.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      tilt.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`)
      tilt.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`)
    }
  }

  const reset = (node: HTMLElement) => {
    node.style.setProperty('--rx', '0deg')
    node.style.setProperty('--ry', '0deg')
  }

  const onLeave = () => {
    if (tilted) reset(tilted)
    tilted = null
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  return () => {
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
  }
}
