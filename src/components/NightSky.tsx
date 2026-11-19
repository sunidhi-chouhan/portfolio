import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getSceneState, isReady, reportLoaded, setSceneState, subscribeScene } from '../lib/intro.ts'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'
import type { Journey, LivingScene } from './hero/living-scene.ts'

/** How fast the illustration drifts relative to the page (1 = moves with the text). */
const PLATE_PARALLAX = 0.8

/**
 * The single canvas behind the whole page. It carries the living illustration
 * in the hero, the open sky through the middle of the page, and the riverbank
 * again at Contact, so the page reads as one continuous night.
 */
export function NightSky() {
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scene = useSyncExternalStore(subscribeScene, getSceneState)

  useEffect(() => {
    const canvas = canvasRef.current
    if (reduced || !canvas) {
      reportLoaded('scene')
      return
    }

    let live = true
    let mounted: LivingScene | null = null
    let contactTop = Number.POSITIVE_INFINITY

    const measure = () => {
      const contact = document.getElementById('contact')
      contactTop = contact ? contact.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY
    }

    const getJourney = (): Journey => {
      const vh = window.innerHeight || 1
      const y = window.scrollY
      const max = Math.max(1, document.documentElement.scrollHeight - vh)
      // Leaving: the illustration rises away with the hero.
      const leaving = -(y / vh) * PLATE_PARALLAX
      // Arriving: it waits below and settles in as Contact reaches the top.
      const settle = Math.min(contactTop, max)
      const arriving = ((settle - y) / vh) * PLATE_PARALLAX
      let plate = 3
      if (leaving > -1.4) plate = leaving
      else if (arriving < 1.4) plate = Math.max(0, arriving)
      return {
        plate,
        scrolled: y / vh,
        page: Math.min(1, y / max),
        hero: Math.min(1, y / vh),
      }
    }

    const image = new Image()
    image.decoding = 'async'
    image.src = window.matchMedia('(max-width: 767px)').matches ? '/midnight/plate-mobile.webp' : '/midnight/plate.webp'
    image.onerror = () => {
      if (image.src.endsWith('.jpg')) {
        reportLoaded('scene')
        setSceneState('down')
        return
      }
      image.src = '/midnight/plate.jpg'
    }
    image.onload = () => {
      reportLoaded('plate')
      void import('./hero/living-scene.ts')
        .then(({ mountLivingScene }) => {
          if (!live) return
          measure()
          mounted = mountLivingScene(canvas, image, {
            getJourney,
            getReady: isReady,
            onFirstFrame: () => {
              reportLoaded('scene')
              if (live) setSceneState('painted')
            },
            onFatal: () => {
              reportLoaded('scene')
              if (live) setSceneState('down')
            },
          })
        })
        .catch(() => {
          reportLoaded('scene')
          setSceneState('down')
        })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      live = false
      image.onload = null
      image.onerror = null
      observer.disconnect()
      window.removeEventListener('resize', measure)
      mounted?.destroy()
      setSceneState('idle')
    }
  }, [reduced])

  if (reduced || scene === 'down') return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-700 ${
        scene === 'painted' ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
