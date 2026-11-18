import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { site } from '../content/site.ts'
import { scrollToSection } from '../lib/scroll.ts'
import type { MidnightScene } from './hero/midnight-scene.ts'

const PLATE_SRC = '/midnight/plate.jpg'

export function Hero() {
  const reduced = usePrefersReducedMotion()
  const allowMotion = !reduced
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const [plateFailed, setPlateFailed] = useState(false)
  const [canvasDown, setCanvasDown] = useState(false)
  const [painted, setPainted] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    const canvas = canvasRef.current
    if (!section || !image) return

    let scene: MidnightScene | null = null
    let live = true

    const syncChrome = (progress: number) => {
      const next = Math.min(1, Math.max(0, progress))
      progressRef.current = next
      if (copyRef.current) {
        copyRef.current.style.transform = `translate3d(0, ${(-26 * next).toFixed(2)}px, 0)`
      }
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - next * 2.5))
      if (barRef.current) barRef.current.style.transform = `scaleX(${next.toFixed(4)})`
      if (sceneRef.current) {
        const hold = (80 - next * 26).toFixed(1)
        const mask = `linear-gradient(to bottom, #000 ${hold}%, transparent 100%)`
        sceneRef.current.style.maskImage = mask
        sceneRef.current.style.setProperty('-webkit-mask-image', mask)
      }
    }

    const start = () => {
      if (!live || scene || !canvas || plateFailed || canvasDown || !allowMotion) return
      if (image.naturalWidth < 2) return
      void import('./hero/midnight-scene.ts').then(({ mountMidnightScene }) => {
        if (!live || scene || !canvas) return
        scene = mountMidnightScene(canvas, image, {
          getProgress: () => progressRef.current,
          onFirstFrame: () => {
            if (!live) return
            setPainted(true)
          },
          onFatal: () => {
            if (!live) return
            setCanvasDown(true)
          },
        })
      })
    }

    let releasePin = () => {}
    let idleId = 0
    let timerId = 0
    const launchMotion = () => {
      if (!live || !allowMotion || plateFailed) return
      start()
      void import('./hero/pin.ts').then(({ mountHeroPin }) => {
        if (!live) return
        releasePin = mountHeroPin(section, syncChrome)
      })
    }
    const onPlate = () => {
      if (!allowMotion || plateFailed) return
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(launchMotion)
      else timerId = window.setTimeout(launchMotion, 600)
    }

    if (image.complete && image.naturalWidth > 0) onPlate()
    else image.addEventListener('load', onPlate)

    syncChrome(0)

    return () => {
      live = false
      image.removeEventListener('load', onPlate)
      if (idleId) window.cancelIdleCallback(idleId)
      if (timerId) window.clearTimeout(timerId)
      scene?.destroy()
      releasePin()
    }
  }, [allowMotion, canvasDown, plateFailed])

  function skipToWork(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    scrollToSection('work')
  }

  useEffect(() => {
    if (!allowMotion) setPainted(false)
  }, [allowMotion])

  const showCanvas = allowMotion && !plateFailed && !canvasDown

  return (
    <section ref={sectionRef} className="relative h-svh overflow-hidden" aria-label="Introduction">
      <div
        ref={sceneRef}
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 80%, transparent 100%)',
        }}
      >
        {plateFailed ? (
          <div className="night-fallback absolute inset-0" />
        ) : (
          <picture>
            <source media="(max-width: 767px)" srcSet="/midnight/plate-mobile.webp" type="image/webp" />
            <source srcSet="/midnight/plate.webp" type="image/webp" />
            <img
              ref={imageRef}
              src={PLATE_SRC}
              alt=""
              width={1280}
              height={720}
              fetchPriority="high"
              onError={() => setPlateFailed(true)}
              className={`absolute inset-0 h-full w-full object-cover object-[88%_42%] transition-opacity duration-700 lg:object-[60%_46%] ${showCanvas && painted ? 'opacity-0' : 'opacity-100'}`}
            />
          </picture>
        )}
        {showCanvas ? (
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${painted ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
      </div>
      <div className="hero-scrim pointer-events-none absolute inset-0" />
      <p className="sr-only">
        Seen from behind, a girl with long dark hair sits beside a river in the rain, looking toward the moon. Willow branches hang over the water.
      </p>
      <div className="hero-copy relative z-10 flex h-full min-h-0 items-end px-5 sm:px-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <div ref={copyRef} className="max-w-xl">
            <p className="hero-kicker hero-rise text-xs tracking-[0.22em] text-moon uppercase">
              {site.journey}
            </p>
            <p
              className="hero-greeting hero-rise mt-6 font-display text-3xl text-sand sm:text-4xl"
              style={allowMotion ? { animationDelay: '80ms' } : undefined}
            >
              {site.greeting}
            </p>
            <h1
              className="hero-title hero-rise mt-1 max-w-full font-display text-sand"
              style={allowMotion ? { animationDelay: '140ms' } : undefined}
            >
              {site.name}
            </h1>
            <p className="hero-line hero-line-in mt-6 max-w-md text-base leading-relaxed font-light text-sand sm:text-lg">
              {site.line}
            </p>
            <p
              className="hero-role hero-rise mt-4 text-xs tracking-[0.2em] text-muted uppercase"
              style={allowMotion ? { animationDelay: '220ms' } : undefined}
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
              Scroll
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
        {allowMotion ? (
          <div className="mx-auto mt-3 h-px w-full max-w-6xl bg-sand/15">
            <div ref={barRef} className="h-px origin-left scale-x-0 bg-moon" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
