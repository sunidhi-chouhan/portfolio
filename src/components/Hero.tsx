import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { site } from '../content/site.ts'
import { getSceneState, reportLoaded, subscribeScene } from '../lib/intro.ts'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'
import { scrollToSection } from '../lib/scroll.ts'
import { SplitText } from './SplitText.tsx'

const PLATE_SRC = '/midnight/plate.jpg'

/**
 * The opening of the night. The living illustration itself is drawn by the
 * page-wide NightSky canvas; this section holds the copy, plus a still of the
 * plate that shows until the canvas paints (and stays if WebGL is unavailable).
 */
export function Hero() {
  const reduced = usePrefersReducedMotion()
  const allowMotion = !reduced
  const scene = useSyncExternalStore(subscribeScene, getSceneState)
  const copyRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const [plateFailed, setPlateFailed] = useState(false)

  // As you leave, the copy lifts and softens into the night.
  useEffect(() => {
    if (!allowMotion) return
    let frame = 0
    const update = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)))
      const copy = copyRef.current
      if (copy) {
        copy.style.transform = `translate3d(0, ${(-60 * progress).toFixed(1)}px, 0)`
        copy.style.opacity = String(1 - progress * progress)
        copy.style.filter = progress > 0.01 ? `blur(${(progress * 6).toFixed(2)}px)` : ''
      }
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - progress * 3))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [allowMotion])

  function skipToWork(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    scrollToSection('work')
  }

  const live = allowMotion && scene === 'painted'

  return (
    <section className="relative h-svh overflow-hidden" aria-label="Introduction">
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${live ? 'opacity-0' : 'opacity-100'}`}
        style={{
          maskImage: 'linear-gradient(to bottom, #000 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 75%, transparent 100%)',
        }}
      >
        {plateFailed ? (
          <div className="night-fallback absolute inset-0" />
        ) : (
          <picture>
            <source media="(max-width: 767px)" srcSet="/midnight/plate-mobile.webp" type="image/webp" />
            <source srcSet="/midnight/plate.webp" type="image/webp" />
            <img
              src={PLATE_SRC}
              alt=""
              width={1280}
              height={720}
              fetchPriority="high"
              onLoad={() => reportLoaded('plate')}
              onError={() => {
                reportLoaded('plate')
                setPlateFailed(true)
              }}
              className="absolute inset-0 h-full w-full object-cover object-[88%_42%] lg:object-[60%_46%]"
            />
          </picture>
        )}
      </div>
      <div className="hero-scrim pointer-events-none absolute inset-0" />
      <p className="sr-only">
        Seen from behind, a girl with long dark hair sits on a grassy bank under a willow, looking across a misty lake at night. The willow sways, her hair moves in the breeze, and fireflies drift over the water. As the page scrolls, the scene drifts away into the night sky and the moon rises.
      </p>
      <div className="hero-copy relative z-10 flex h-full min-h-0 items-end px-5 sm:px-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <div ref={copyRef} className="max-w-xl will-change-transform">
            <p className="hero-kicker hero-rise text-xs tracking-[0.22em] text-moon uppercase">
              {site.journey}
            </p>
            <p
              className="hero-greeting hero-rise mt-6 font-display text-3xl text-sand sm:text-4xl"
              style={allowMotion ? { animationDelay: '120ms' } : undefined}
            >
              {site.greeting}
            </p>
            <h1 className="hero-title mt-1 max-w-full font-display text-sand">
              <SplitText text={site.name} by="char" className="hero-chars" baseDelay={0.2} step={0.035} />
            </h1>
            <p
              className="hero-line hero-rise mt-6 max-w-md text-base leading-relaxed font-light text-sand sm:text-lg"
              style={allowMotion ? { animationDelay: '720ms' } : undefined}
            >
              {site.line}
            </p>
            <p
              className="hero-role hero-rise mt-4 text-xs tracking-[0.2em] text-muted uppercase"
              style={allowMotion ? { animationDelay: '860ms' } : undefined}
            >
              {site.role}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4">
          {allowMotion ? (
            <p ref={hintRef} aria-hidden="true" className="text-xs tracking-[0.22em] text-sand/80 uppercase">
              <span className="hero-rise flex items-center gap-3" style={{ animationDelay: '1100ms' }}>
                <span className="scroll-cue" />
                Scroll
              </span>
            </p>
          ) : (
            <span />
          )}
          <a
            href="#work"
            onClick={skipToWork}
            className="inline-flex min-h-11 items-center text-xs tracking-[0.18em] text-sand uppercase"
          >
            Skip to work
          </a>
        </div>
      </div>
    </section>
  )
}
