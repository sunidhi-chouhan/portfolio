import { useEffect, useRef, useState } from 'react'
import { site } from '../content/site.ts'
import { loadedShare, markReady, reportLoaded } from '../lib/intro.ts'
import { pauseScroll } from '../lib/smooth-scroll.ts'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'

const MIN_MS = 1300
const MAX_MS = 4500
const EXIT_MS = 1100

/**
 * The opening curtain: a handwritten first name and a thin counting line while
 * the fonts, the plate and the WebGL scene get ready, then the curtain lifts
 * and the scene fades in behind it.
 */
export function Loader() {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'gone'>(reduced ? 'gone' : 'loading')
  const countRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const firstName = site.name.split(' ')[0] ?? site.name

  useEffect(() => {
    void document.fonts?.ready.then(() => reportLoaded('fonts'))
    if (reduced) {
      markReady()
      return
    }
    let paused = true
    pauseScroll(true)
    const release = () => {
      if (!paused) return
      paused = false
      pauseScroll(false)
    }
    const started = performance.now()
    let shown = 0
    let last = started
    let frame = 0
    let leaveTimer = 0
    let goneTimer = 0
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setPhase('leaving')
      markReady()
      release()
      goneTimer = window.setTimeout(() => setPhase('gone'), EXIT_MS)
    }

    const step = (now: number) => {
      const elapsed = now - started
      // Never run ahead of real progress, and never finish before MIN_MS.
      const timeCap = Math.min(1, elapsed / MIN_MS)
      const target = elapsed > MAX_MS ? 1 : Math.min(loadedShare(), timeCap)
      // Time-based easing so slow devices don't stretch the curtain.
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      shown += (Math.max(target, shown) - shown) * (1 - Math.exp(-dt * 7))
      if (target === 1 && shown > 0.995) shown = 1
      if (countRef.current) countRef.current.textContent = String(Math.round(shown * 100)).padStart(2, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown.toFixed(4)})`
      if (shown >= 1) {
        leaveTimer = window.setTimeout(finish, 220)
        return
      }
      frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(goneTimer)
      release()
    }
  }, [reduced])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      className={`loader fixed inset-0 z-[100] flex items-end bg-ink px-5 pb-[18vh] sm:px-8 ${phase === 'leaving' ? 'loader-out' : ''}`}
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="loader-kicker text-xs tracking-[0.22em] text-moon uppercase">{site.journey}</p>
        <p className="loader-name mt-4 font-display text-[clamp(3rem,14vw,8rem)] leading-[0.9] text-sand">
          {[...firstName].map((char, index) => (
            <span key={index} className="loader-char" style={{ animationDelay: `${120 + index * 70}ms` }}>
              {char}
            </span>
          ))}
        </p>
        <div className="mt-8 flex max-w-md items-center gap-4">
          <span className="relative h-px flex-1 overflow-hidden bg-sand/15">
            <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-moon" />
          </span>
          <span className="w-8 text-right text-xs tabular-nums tracking-[0.18em] text-muted">
            <span ref={countRef}>00</span>%
          </span>
        </div>
      </div>
    </div>
  )
}
