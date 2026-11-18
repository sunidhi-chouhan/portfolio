import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'

type Stage = {
  heroCover: number
  discovery: number
  exploration: number
  departure: number
}

type Mote = {
  x: number
  y: number
  phase: number
  speed: number
  radius: number
}

type Star = {
  x: number
  y: number
  radius: number
  alpha: number
  phase: number
  speed: number
}

const FOG = [
  { y: 0.58, height: 0.34, alpha: 0.05, speed: 0.05 },
  { y: 0.72, height: 0.26, alpha: 0.04, speed: 0.08 },
  { y: 0.84, height: 0.22, alpha: 0.035, speed: 0.06 },
]

export function Atmosphere() {
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced === true) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const mobile = window.matchMedia('(max-width: 767px)').matches
    const stars = createStars(mobile ? 16 : 28)
    const motes = createMotes(mobile ? 7 : 12)
    let frameId = 0
    let running = true
    let loopOn = false
    let dpr = 1
    let lastPaint = 0
    let stage = readStage()
    const frameGap = mobile ? 34 : 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)
      const width = Math.max(1, Math.round(window.innerWidth * dpr))
      const height = Math.max(1, Math.round(window.innerHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      canvas.style.width = '100%'
      canvas.style.height = '100%'
    }

    const wake = () => {
      if (!running || loopOn || document.hidden) return
      loopOn = true
      frameId = window.requestAnimationFrame(draw)
    }

    const draw = (now: number) => {
      loopOn = false
      if (!running || document.hidden) return
      frameId = window.requestAnimationFrame(draw)
      if (!running) {
        window.cancelAnimationFrame(frameId)
        return
      }
      loopOn = true
      if (frameGap && now - lastPaint < frameGap) return
      lastPaint = now
      const time = now / 1000
      const width = canvas.width
      const height = canvas.height
      paintField(context, width, height, stage)
      paintStars(context, stars, width, height, time, stage, dpr)
      paintMoon(context, width, height, time, stage, dpr)
      paintFog(context, width, height, time, stage, dpr)
      paintMotes(context, motes, width, height, time, stage, dpr)
      paintDestinations(context, stage, dpr)
    }

    const onVisibility = () => {
      if (!document.hidden) wake()
    }

    const onScroll = () => {
      stage = readStage()
    }
    let idleId = 0
    let timerId = 0
    const launch = () => {
      if (!running) return
      resize()
      stage = readStage()
      wake()
    }
    if (window.requestIdleCallback) idleId = window.requestIdleCallback(launch, { timeout: 1500 })
    else timerId = window.setTimeout(launch, 700)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      running = false
      if (idleId) window.cancelIdleCallback(idleId)
      if (timerId) window.clearTimeout(timerId)
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  if (reduced === true) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[linear-gradient(180deg,#102033_0%,#0c2430_46%,#071018_100%)]"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
    />
  )
}

function readStage(): Stage {
  const vh = window.innerHeight || 1
  const hero = document.querySelector('section[aria-label="Introduction"]')
  const about = document.getElementById('about')
  const work = document.getElementById('work')
  const contact = document.getElementById('contact')
  const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0
  const aboutTop = about ? about.getBoundingClientRect().top : vh
  const workTop = work ? work.getBoundingClientRect().top : vh * 2
  const contactTop = contact ? contact.getBoundingClientRect().top : vh * 3
  const heroCover = clamp(heroBottom / vh, 0, 1)
  const aboutIn = clamp(1 - aboutTop / vh, 0, 1)
  const workIn = clamp(1 - workTop / (vh * 0.9), 0, 1)
  const contactIn = clamp(1 - contactTop / (vh * 0.85), 0, 1)
  return {
    heroCover,
    discovery: aboutIn * (1 - workIn * 0.85),
    exploration: workIn * (1 - contactIn * 0.8),
    departure: contactIn,
  }
}

function paintField(ctx: CanvasRenderingContext2D, width: number, height: number, stage: Stage) {
  const river: [number, number, number] = [12, 36, 48]
  const ink: [number, number, number] = [7, 12, 22]
  const late: [number, number, number] = [14, 34, 44]
  const explored = mix(river, ink, clamp(stage.exploration, 0, 1))
  const color = mix(explored, late, stage.departure * 0.55)
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  ctx.fillRect(0, 0, width, height)
}

function paintStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  time: number,
  stage: Stage,
  dpr: number,
) {
  const amount = (1 - stage.discovery * 0.92) * (0.22 + stage.departure * 0.4) * (1 - stage.exploration * 0.35)
  if (amount < 0.02) return
  ctx.save()
  stars.forEach((star) => {
    const twinkle = 0.55 + 0.45 * Math.sin(time * star.speed + star.phase)
    ctx.globalAlpha = star.alpha * twinkle * amount
    ctx.fillStyle = '#f4efe4'
    ctx.beginPath()
    ctx.arc(star.x * width, star.y * height, star.radius * dpr, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function paintMoon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  stage: Stage,
  dpr: number,
) {
  const uncover = clamp((0.2 - stage.heroCover) / 0.2, 0, 1)
  const presence =
    uncover *
    (0.55 + stage.discovery * 0.1 + stage.departure * 0.3) *
    (1 - clamp(stage.exploration * 1.2, 0, 1))
  if (presence < 0.02 || width / dpr < 720) return
  const x = width * 0.9 + Math.sin(time * 0.08) * 4 * dpr
  const y = height * (0.14 + stage.departure * 0.02)
  const radius = Math.min(width, height) * (0.04 - stage.departure * 0.008)
  const glow = 0.16 + stage.departure * 0.05
  ctx.save()
  ctx.globalAlpha = presence
  const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * (3.2 + stage.discovery * 0.8))
  halo.addColorStop(0, `rgba(255, 244, 214, ${glow})`)
  halo.addColorStop(0.5, `rgba(255, 236, 196, ${glow * 0.22})`)
  halo.addColorStop(1, 'rgba(255, 236, 196, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, radius * 3.4, 0, Math.PI * 2)
  ctx.fill()
  const disc = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.25, radius * 0.1, x, y, radius)
  disc.addColorStop(0, `rgba(255, 248, 232, ${1 - stage.departure * 0.25})`)
  disc.addColorStop(1, `rgba(228, 208, 154, ${0.85 - stage.departure * 0.2})`)
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function paintFog(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  stage: Stage,
  dpr: number,
) {
  const amount = clamp(stage.discovery * 0.9 - stage.exploration * 0.7 - stage.departure * 0.55, 0, 1)
  if (amount < 0.04) return
  ctx.save()
  FOG.forEach((layer) => {
    const drift = Math.sin(time * layer.speed) * 10 * dpr
    const y = layer.y * height + drift
    const band = layer.height * height
    const shade = ctx.createLinearGradient(0, y, 0, y + band)
    const alpha = layer.alpha * amount
    shade.addColorStop(0, 'rgba(158, 184, 194, 0)')
    shade.addColorStop(0.5, `rgba(158, 184, 194, ${alpha})`)
    shade.addColorStop(1, 'rgba(158, 184, 194, 0)')
    ctx.fillStyle = shade
    ctx.fillRect(0, y, width, band)
  })
  ctx.restore()
}

function paintMotes(
  ctx: CanvasRenderingContext2D,
  motes: Mote[],
  width: number,
  height: number,
  time: number,
  stage: Stage,
  dpr: number,
) {
  const amount = stage.discovery * (1 - stage.departure) * (1 - stage.exploration * 0.45)
  if (amount < 0.04) return
  ctx.save()
  ctx.fillStyle = '#e7c27a'
  motes.forEach((mote) => {
    const x = (mote.x + Math.sin(time * mote.speed + mote.phase) * 0.035) * width
    const y = (mote.y + Math.cos(time * mote.speed * 0.65 + mote.phase) * 0.028) * height
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.4 + mote.phase))
    ctx.globalAlpha = twinkle * amount
    ctx.beginPath()
    ctx.arc(x, y, mote.radius * dpr, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function paintDestinations(ctx: CanvasRenderingContext2D, stage: Stage, dpr: number) {
  const amount = stage.exploration * (1 - stage.departure * 0.85)
  if (amount < 0.05) return
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-destination]')]
  ctx.save()
  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) return
    const x = (rect.left + 16) * dpr
    const y = (rect.top + 22) * dpr
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 14 * dpr)
    glow.addColorStop(0, `rgba(240, 226, 176, ${0.7 * amount})`)
    glow.addColorStop(1, 'rgba(240, 226, 176, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, 14 * dpr, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function createStars(count: number): Star[] {
  const random = mulberry32(9)
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random() * 0.42,
    radius: 0.45 + random() * 0.9,
    alpha: 0.25 + random() * 0.4,
    phase: random() * Math.PI * 2,
    speed: 0.35 + random() * 0.7,
  }))
}

function createMotes(count: number): Mote[] {
  const random = mulberry32(4)
  return Array.from({ length: count }, () => ({
    x: 0.12 + random() * 0.76,
    y: 0.38 + random() * 0.4,
    phase: random() * Math.PI * 2,
    speed: 0.15 + random() * 0.25,
    radius: 1.1 + random() * 0.8,
  }))
}

function mix(from: [number, number, number], to: [number, number, number], amount: number) {
  const t = clamp(amount, 0, 1)
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ] as [number, number, number]
}

function mulberry32(seed: number) {
  let value = seed
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let next = Math.imul(value ^ (value >>> 15), 1 | value)
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
