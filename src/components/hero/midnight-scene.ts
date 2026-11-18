export const PLATE_SRC = '/midnight/plate.jpg'

type Frame = {
  dx: number
  dy: number
  dw: number
  dh: number
}

type Drop = {
  x: number
  y: number
  speed: number
  length: number
  alpha: number
  depth: number
}

type Ripple = {
  x: number
  y: number
  radius: number
  life: number
}

type Bead = {
  x: number
  y: number
  tip: number
  vy: number
}

export type MidnightScene = {
  destroy: () => void
}

type MountOptions = {
  getProgress: () => number
  onFirstFrame: () => void
  onFatal: () => void
}

const TIPS = [
  [0.3, 0.5],
  [0.38, 0.58],
  [0.46, 0.48],
  [0.54, 0.56],
  [0.64, 0.42],
] as const

export function mountMidnightScene(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: MountOptions,
): MidnightScene {
  const context = canvas.getContext('2d')
  if (!context) {
    options.onFatal()
    return { destroy() {} }
  }

  const drops = createDrops(window.innerWidth >= 768)
  const ripples: Ripple[] = []
  const beads = TIPS.map((tip, index) => ({
    x: tip[0],
    y: tip[1],
    tip: index,
    vy: 0.08 + (index % 3) * 0.03,
  }))
  let dpr = 1
  let frameId = 0
  let running = true
  let loopOn = false
  let onscreen = true
  let painted = false
  let failed = false
  let lastPaint = 0

  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const narrow = rect.width < 768
    dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.5)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = '100%'
    canvas.style.height = '100%'
  }

  const fail = (error: unknown) => {
    if (failed) return
    failed = true
    running = false
    window.cancelAnimationFrame(frameId)
    console.error(error)
    options.onFatal()
  }

  const wake = () => {
    if (!running || loopOn || !onscreen || document.hidden) return
    loopOn = true
    frameId = window.requestAnimationFrame(tick)
  }

  const tick = (now: number) => {
    loopOn = false
    if (!running || !onscreen || document.hidden) return
    frameId = window.requestAnimationFrame(tick)
    if (!running) {
      window.cancelAnimationFrame(frameId)
      return
    }
    loopOn = true
    try {
      const narrow = canvas.width < canvas.height || canvas.width / dpr < 768
      if (narrow && now - lastPaint < 32) return
      lastPaint = now
      paint(context, canvas, image, drops, ripples, beads, options.getProgress(), now / 1000, dpr, narrow)
      if (!painted && canvas.width > 2 && image.naturalWidth > 0) {
        painted = true
        options.onFirstFrame()
      }
    } catch (error) {
      fail(error)
    }
  }

  const onVisibility = () => wake()
  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver((entries) => {
    onscreen = entries.some((entry) => entry.isIntersecting)
    if (onscreen) wake()
  })
  if (canvas.parentElement) {
    resizeObserver.observe(canvas.parentElement)
    visibilityObserver.observe(canvas.parentElement)
  }
  document.addEventListener('visibilitychange', onVisibility)
  resize()
  wake()

  return {
    destroy() {
      running = false
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}

function paint(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  drops: Drop[],
  ripples: Ripple[],
  beads: Bead[],
  progress: number,
  time: number,
  dpr: number,
  narrow: boolean,
) {
  const width = canvas.width
  const height = canvas.height
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  if (width < 2 || height < 2 || iw < 2 || ih < 2) return

  const p = clamp(progress, 0, 1)
  const focusX = narrow ? 0.86 - p * 0.08 : 0.64 - p * 0.18
  const focusY = narrow ? 0.4 - p * 0.04 : 0.48 - p * 0.07
  const frame = coverFrame(iw, ih, width, height, focusX, focusY, 1.06)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#071422'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, iw, ih, frame.dx, frame.dy, frame.dw, frame.dh)
  veilStars(ctx, width, height, frame, p)
  drawMoon(ctx, frame, time, p, dpr)
  drawRipples(ctx, frame, ripples, dpr)
  drawRain(ctx, drops, width, height, p, dpr, narrow, ripples)
  drawBeads(ctx, frame, beads, time, dpr, ripples)
  drawMist(ctx, frame, time, p)
}

function coverFrame(
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  focusX: number,
  focusY: number,
  overscan: number,
): Frame {
  const scale = Math.max(cw / iw, ch / ih) * overscan
  const dw = iw * scale
  const dh = ih * scale
  return {
    dx: focusX * cw - focusX * dw,
    dy: focusY * ch - focusY * dh,
    dw,
    dh,
  }
}

function veilStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: Frame,
  progress: number,
) {
  if (progress < 0.02) return
  const fade = ctx.createLinearGradient(0, Math.min(0, frame.dy), 0, frame.dy + frame.dh * 0.86)
  fade.addColorStop(0, `rgba(8, 18, 34, ${progress * 0.78})`)
  fade.addColorStop(1, 'rgba(8, 18, 34, 0)')
  ctx.save()
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  time: number,
  progress: number,
  dpr: number,
) {
  const x = frame.dx + frame.dw * (0.806 - progress * 0.07) + Math.sin(time * 0.12) * 4 * dpr
  const y = frame.dy + frame.dh * (0.25 - progress * 0.04) + Math.cos(time * 0.09) * 2.5 * dpr
  const radius = frame.dw * 0.058
  const glow = 0.18 + Math.sin(time * 0.32) * 0.03 + progress * 0.16
  const reach = radius * (3.1 + progress * 1.6)

  ctx.save()
  const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, reach)
  halo.addColorStop(0, `rgba(255, 244, 214, ${glow})`)
  halo.addColorStop(0.45, `rgba(255, 236, 196, ${glow * 0.28})`)
  halo.addColorStop(1, 'rgba(255, 236, 196, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, reach, 0, Math.PI * 2)
  ctx.fill()

  const disc = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.3, radius * 0.1, x, y, radius)
  disc.addColorStop(0, '#fff8e8')
  disc.addColorStop(0.55, '#f3e2b4')
  disc.addColorStop(1, '#e4d09a')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#c9b27a'
  ctx.beginPath()
  ctx.ellipse(x - radius * 0.15, y + radius * 0.1, radius * 0.22, radius * 0.16, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + radius * 0.28, y - radius * 0.12, radius * 0.14, radius * 0.1, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const drift = Math.sin(time * 0.18) * radius * 0.45 - progress * radius * 0.7
  drawCloud(ctx, x + drift, y, radius * 0.5, radius * 0.42, 0.16)
  drawCloud(ctx, x - drift * 0.4, y + radius * 0.15, radius * 0.36, radius * 0.3, 0.1 + progress * 0.06)
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number,
) {
  const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx)
  cloud.addColorStop(0, `rgba(214, 224, 232, ${alpha})`)
  cloud.addColorStop(1, 'rgba(214, 224, 232, 0)')
  ctx.save()
  ctx.fillStyle = cloud
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  drops: Drop[],
  width: number,
  height: number,
  progress: number,
  dpr: number,
  narrow: boolean,
  ripples: Ripple[],
) {
  const amount = 1 - progress * 0.94
  if (amount < 0.04) return
  const limit = narrow ? Math.floor(drops.length * 0.55) : drops.length
  ctx.save()
  ctx.lineCap = 'round'
  for (let index = 0; index < limit; index += 1) {
    const drop = drops[index]
    if (!drop) continue
    drop.y += drop.speed * 0.016
    drop.x -= drop.speed * 0.0012
    if (drop.y > 1.05) {
      if (drop.depth > 0 && drop.x < 0.66 && drop.x > 0.02) {
        spawnRipple(ripples, drop.x, 0.58 + (drop.x % 0.08))
      }
      drop.y = -0.05
      drop.x = (drop.x + 0.37) % 1
    }
    const x = drop.x * width
    const y = drop.y * height
    ctx.globalAlpha = drop.alpha * amount
    ctx.strokeStyle = drop.depth === 0 ? 'rgba(198, 214, 228, 0.9)' : 'rgba(236, 242, 248, 1)'
    ctx.lineWidth = (drop.depth === 2 ? 1.35 : 0.8) * dpr
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - drop.length * 0.18, y + drop.length)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBeads(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  beads: Bead[],
  time: number,
  dpr: number,
  ripples: Ripple[],
) {
  ctx.save()
  ctx.fillStyle = 'rgba(226, 236, 242, 0.85)'
  beads.forEach((bead) => {
    bead.y += bead.vy * 0.014
    bead.x += Math.sin(time * 1.4 + bead.tip) * 0.00015
    const tip = TIPS[bead.tip]
    if (!tip || bead.y > 0.64) {
      spawnRipple(ripples, bead.x, Math.min(bead.y, 0.66))
      if (tip) {
        bead.x = tip[0]
        bead.y = tip[1]
      }
    }
    const x = frame.dx + bead.x * frame.dw
    const y = frame.dy + bead.y * frame.dh
    ctx.beginPath()
    ctx.arc(x, y, 2.4 * dpr, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function drawRipples(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  ripples: Ripple[],
  dpr: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(226, 238, 244, 0.55)'
  for (let index = ripples.length - 1; index >= 0; index -= 1) {
    const ripple = ripples[index]
    if (!ripple) continue
    ripple.radius += 0.45 * dpr
    ripple.life -= 0.012
    if (ripple.life <= 0) {
      ripples.splice(index, 1)
      continue
    }
    ctx.globalAlpha = ripple.life
    ctx.lineWidth = dpr
    ctx.beginPath()
    ctx.ellipse(
      frame.dx + ripple.x * frame.dw,
      frame.dy + ripple.y * frame.dh,
      ripple.radius,
      ripple.radius * 0.36,
      0,
      0,
      Math.PI * 2,
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawMist(ctx: CanvasRenderingContext2D, frame: Frame, time: number, progress: number) {
  const banks = [
    { x: 0.22, y: 0.8, r: 0.34, phase: 0.2 },
    { x: 0.5, y: 0.86, r: 0.3, phase: 1.1 },
    { x: 0.74, y: 0.78, r: 0.26, phase: 2 },
  ]
  ctx.save()
  banks.forEach((bank, index) => {
    const drift = Math.sin(time * 0.16 + bank.phase) * frame.dw * 0.03
    const x = frame.dx + bank.x * frame.dw + drift
    const y = frame.dy + (bank.y - progress * 0.06) * frame.dh
    const radius = bank.r * frame.dw * (1 + progress * 0.15)
    const alpha = 0.035 + progress * 0.09 + index * 0.008
    const mist = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius)
    mist.addColorStop(0, `rgba(198, 214, 222, ${alpha})`)
    mist.addColorStop(1, 'rgba(198, 214, 222, 0)')
    ctx.fillStyle = mist
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

function spawnRipple(ripples: Ripple[], x: number, y: number) {
  if (ripples.length > 28) ripples.shift()
  ripples.push({ x, y, radius: 2, life: 0.85 })
}

function createDrops(dense: boolean): Drop[] {
  const random = mulberry32(21)
  const drops: Drop[] = []
  const scale = dense ? 1 : 0.55
  const layers = [
    { count: Math.round(70 * scale), speed: 0.45, length: 12, alpha: 0.16, depth: 0 },
    { count: Math.round(40 * scale), speed: 0.75, length: 20, alpha: 0.28, depth: 1 },
    { count: Math.round(22 * scale), speed: 1.15, length: 30, alpha: 0.48, depth: 2 },
  ]
  layers.forEach((layer) => {
    for (let index = 0; index < layer.count; index += 1) {
      drops.push({
        x: random(),
        y: random(),
        speed: layer.speed + random() * 0.25,
        length: layer.length + random() * 10,
        alpha: layer.alpha + random() * 0.08,
        depth: layer.depth,
      })
    }
  })
  return drops
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
