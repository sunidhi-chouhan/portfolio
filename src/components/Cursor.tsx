import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'

/**
 * A soft ring that trails the pointer and opens up over anything clickable.
 * Mouse and trackpad only; the native cursor stays visible.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion()
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    if (reduced || !ring || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let x = -100
    let y = -100
    let tx = -100
    let ty = -100
    let frame = 0
    let moving = false

    const loop = () => {
      x += (tx - x) * 0.18
      y += (ty - y) * 0.18
      ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.2) {
        frame = window.requestAnimationFrame(loop)
      } else {
        moving = false
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      tx = event.clientX
      ty = event.clientY
      ring.dataset.on = 'true'
      const target = event.target instanceof Element ? event.target : null
      ring.dataset.hot = target?.closest('a, button, [role="button"]') ? 'true' : 'false'
      if (!moving) {
        moving = true
        frame = window.requestAnimationFrame(loop)
      }
    }
    const onLeave = () => {
      ring.dataset.on = 'false'
    }
    const onDown = () => {
      ring.dataset.press = 'true'
    }
    const onUp = () => {
      ring.dataset.press = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [reduced])

  if (reduced) return null
  return (
    <div ref={ringRef} aria-hidden="true" className="cursor-ring pointer-events-none fixed top-0 left-0 z-[95]">
      <span />
    </div>
  )
}
