/**
 * One night, one canvas: a fixed full-page shader behind every section.
 *
 * The hero illustration is a layer inside that night. A precomputed flow map
 * (public/midnight/flow.png, built by scripts/build-flow-map.py) says which
 * pixels are willow, water and hair and how near each one is, so the shader
 * can sway the fronds, flutter her hair and ripple the lake.
 *
 * Behind the illustration is a live sky: star layers at different depths,
 * the Milky Way, a moon that rises from behind the treeline as you scroll,
 * an aurora and the odd shooting star. When you scroll, the illustration
 * drifts up and away like a foreground layer, its bank dissolving into mist,
 * and the same sky carries on behind About, Work and Notes. At Contact the
 * riverbank scrolls back into view from below.
 */

export const FLOW_SRC = '/midnight/flow.png'

export type LivingScene = {
  destroy: () => void
}

/** Where the journey is, in screen heights. Supplied by the page every frame. */
export type Journey = {
  /** Illustration offset: 0 = in place, negative = moved up, positive = waiting below. */
  plate: number
  /** Total distance scrolled, drives the sky's parallax. */
  scrolled: number
  /** 0..1 across the whole page, drives the moon and aurora. */
  page: number
  /** 0..1 through the hero, deepens the mist. */
  hero: number
}

type MountOptions = {
  getJourney: () => Journey
  /** False until the loader has lifted. */
  getReady: () => boolean
  onFirstFrame: () => void
  onFatal: () => void
}

const RIPPLES = 5

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAGMENT = (mobile: boolean) => `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPlate;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform vec2 uSpan;
uniform vec2 uImg;
uniform float uTime;
uniform float uIntro;
uniform float uPlateY;
uniform float uScrolled;
uniform float uPage;
uniform float uHero;
uniform float uVel;
uniform vec3 uMoon;
uniform float uMoonVis;
uniform vec2 uPointer;
uniform vec2 uPointerScreen;
uniform float uPointerOn;
uniform float uGust;
uniform vec3 uRipples[${RIPPLES}];

#define FIREFLIES ${mobile ? 9 : 18}
#define OCTAVES ${mobile ? 3 : 4}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// One layer of stars. s is sky space (screen heights), scale = cells per screen height.
vec3 stars(vec2 s, float scale, float density, float size, float stretch) {
  vec2 g = s * scale;
  vec2 id = floor(g);
  float h = hash(id);
  if (h > density) return vec3(0.0);
  vec2 d = fract(g) - 0.5 - (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.7;
  d.y /= stretch;
  float r = size * (0.5 + hash(id + 1.3));
  float dd = dot(d, d);
  float core = exp(-dd / (r * r)) + exp(-dd / (r * r * 9.0)) * 0.12;
  float tw = 0.55 + 0.45 * sin(uTime * (0.6 + h * 3.0) + h * 40.0);
  vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.92, 0.78), hash(id + 9.4));
  return tint * core * tw / sqrt(stretch);
}

vec3 skyBase(vec2 uv) {
  vec3 col = mix(vec3(0.03, 0.055, 0.105), vec3(0.05, 0.095, 0.15), uv.y);
  // Deeper, a touch violet, the further into the night you go.
  return mix(col, col * vec3(0.85, 0.85, 1.12), uPage);
}

vec3 sky(vec2 uv, vec2 aspect) {
  float t = uTime;
  vec3 col = skyBase(uv);

  vec2 w = vec2((uv.x - 0.5) * aspect.x, uv.y);
  float streak = 1.0 + min(abs(uVel) * 1.2, 1.6);

  // The Milky Way: a dusty diagonal band, far away, barely moving.
  vec2 m = w + vec2(0.0, uScrolled * 0.05) - uPointer * 0.004;
  float band = exp(-pow((m.y - 0.45 + m.x * 0.5) / 0.2, 2.0));
  float dust = fbm(m * 3.5 + vec2(t * 0.004, 0.0));
  col += vec3(0.3, 0.3, 0.45) * band * smoothstep(0.35, 0.85, dust) * 0.16;

  // Three star depths: the near ones slide further when you scroll or move.
  col += stars(w + vec2(0.0, uScrolled * 0.08) - uPointer * 0.003, 26.0, 0.55, 0.03, 1.0 + (streak - 1.0) * 0.2) * 0.5;
  col += stars(w + vec2(0.0, uScrolled * 0.18) - uPointer * 0.006, 13.0, 0.4, 0.02, 1.0 + (streak - 1.0) * 0.5) * 0.8;
  col += stars(w + vec2(0.0, uScrolled * 0.32) - uPointer * 0.01, 7.0, 0.3, 0.012, streak) * 1.2;

  // Aurora: soft curtains that come out once you are in the open sky.
  float glowUp = smoothstep(0.08, 0.3, uPage) * (1.0 - smoothstep(0.78, 0.95, uPage));
  if (glowUp > 0.0) {
    float x = w.x;
    float y0 = 0.3 + 0.07 * sin(x * 2.3 + t * 0.12) + 0.05 * sin(x * 5.1 - t * 0.09);
    float curtain = exp(-pow((uv.y - y0) / 0.16, 2.0)) * smoothstep(0.0, 0.25, uv.y - y0 + 0.2);
    float folds = 0.55 + 0.45 * noise(vec2(x * 26.0 + t * 0.3, t * 0.1));
    float drift = smoothstep(0.3, 0.8, fbm(vec2(x * 1.6 - t * 0.03, t * 0.02)));
    vec3 hue = mix(vec3(0.25, 0.62, 0.56), vec3(0.55, 0.45, 0.85), smoothstep(-0.6, 0.6, x + sin(t * 0.05)));
    col += hue * curtain * folds * drift * glowUp * 0.28;
  }

  // A shooting star every few seconds.
  float slot = floor(t / 7.0);
  float life = fract(t / 7.0) * 7.0;
  if (life < 1.0) {
    vec2 start = vec2((hash(vec2(slot, 2.0)) - 0.2) * aspect.x, 0.05 + hash(vec2(slot, 5.0)) * 0.35);
    vec2 dir = normalize(vec2(-1.0, 0.38));
    vec2 head = start + dir * life * 0.7;
    vec2 rel = vec2((uv.x) * aspect.x, uv.y) - head;
    float along = dot(rel, -dir);
    float across = length(rel + dir * along);
    float tail = smoothstep(0.22, 0.0, along) * step(0.0, along);
    col += vec3(0.9, 0.95, 1.0) * tail * exp(-across * across * 90000.0) * sin(life * 3.14159) * 0.9;
  }

  // The moon: a soft disc with a faint face and a wide halo.
  vec2 md = (uv - uMoon.xy) * aspect / uMoon.z;
  float mr = length(md);
  float halo = exp(-mr * 1.6) * 0.12 + exp(-mr * 0.6) * 0.035;
  col += vec3(1.0, 0.94, 0.8) * halo * uMoonVis;
  float disc = smoothstep(1.0, 0.96, mr) * uMoonVis;
  if (disc > 0.0) {
    float face = fbm(md * 2.2 + 4.0);
    vec3 moonCol = mix(vec3(0.86, 0.83, 0.74), vec3(0.66, 0.63, 0.55), smoothstep(0.45, 0.75, face));
    moonCol *= 1.0 - 0.18 * mr * mr;
    col = mix(col, moonCol, disc);
  }
  return col;
}

float gOpen = 0.0;

// The illustration. Returns colour; alpha is how opaque it is over the sky.
vec4 plate(vec2 p) {
  float t = uTime;

  // Pointer parallax: near things (high depth) slide against the far sky.
  float depth = (texture2D(uFlow, p).a - 0.3) / 0.7;
  p -= uPointer * (depth - 0.35) * vec2(0.012, 0.007);

  vec4 flow = texture2D(uFlow, p);
  float sway = flow.r;
  float water = flow.g;
  float hair = flow.b;

  float phase = p.x * 2.2 - p.y * 1.4;
  float wind = 0.55 * sin(t * 0.52 + phase)
             + 0.3 * sin(t * 1.07 + phase * 2.6 + 1.3)
             + 0.15 * sin(t * 2.3 + p.x * 21.0 + p.y * 9.0);
  float gust = uGust * (0.7 + 0.3 * sin(t * 6.0 + p.y * 30.0));
  vec2 offset = vec2((wind * 0.5 + 0.25 + gust) * 0.0075, sin(t * 0.8 + p.x * 9.0) * 0.0011) * sway;

  float flutter = 0.6 * sin(t * 2.0 + p.y * 38.0 - p.x * 12.0) + 0.4 * sin(t * 3.3 + p.y * 61.0);
  offset += vec2((0.55 + flutter * 0.45 + gust * 1.4) * 0.0042, flutter * 0.0016) * hair;

  float swell = sin(p.y * 240.0 - t * 1.4 + sin(p.x * 18.0 + t * 0.35) * 2.2);
  offset += vec2(swell * 0.0011, swell * 0.0004) * water;
  float rings = 0.0;
  for (int i = 0; i < ${RIPPLES}; i++) {
    vec3 r = uRipples[i];
    float age = t - r.z;
    if (age < 0.0 || age > 4.0) continue;
    vec2 d = (p - r.xy) * vec2(uImg.x / uImg.y, 2.6);
    float dist = length(d);
    float front = age * 0.11;
    float band = smoothstep(0.07, 0.0, abs(dist - front));
    float wave = sin((dist - front) * 160.0) * band * exp(-age * 1.1);
    offset += normalize(d + 1e-5) * wave * 0.0035 * water;
    rings += max(wave, 0.0) * water;
  }

  vec3 col = texture2D(uPlate, p - offset).rgb;

  // The bright star above her: a slow breathing cross flare.
  vec2 sp = (p - vec2(0.806, 0.25)) * uImg / uImg.y;
  float flare = (exp(-abs(sp.x) * 900.0) * exp(-abs(sp.y) * 40.0) + exp(-abs(sp.y) * 900.0) * exp(-abs(sp.x) * 40.0)) * 0.35
              + exp(-dot(sp, sp) * 9000.0) * 0.5;
  col += vec3(0.85, 0.92, 1.0) * flare * (0.75 + 0.25 * sin(t * 0.9));

  // Moonlight on the water: a glittering column under the glow on the horizon.
  float column = exp(-pow((p.x - 0.695) * 22.0, 2.0)) * smoothstep(0.64, 0.68, p.y) * smoothstep(0.9, 0.7, p.y);
  float glitter = pow(noise(vec2(p.x * 260.0 + sin(t * 0.7) * 3.0, p.y * 900.0 - t * 2.2)), 9.0);
  float speckle = pow(noise(vec2(p.x * 500.0, p.y * 1500.0 + t * 1.3)), 14.0);
  col += vec3(1.0, 0.95, 0.8) * water * (glitter * column * 1.6 + speckle * 0.35);
  col += vec3(0.75, 0.85, 0.9) * rings * 0.18;

  // Mist drifting over the water line, thicker as you leave.
  float mistBand = smoothstep(0.5, 0.6, p.y) * smoothstep(0.82, 0.62, p.y);
  float mist = fbm(vec2(p.x * 3.2 - t * 0.018, p.y * 9.0 + t * 0.006));
  float lowMist = fbm(vec2(p.x * 5.0 + t * 0.03, p.y * 14.0 - 3.0)) * smoothstep(0.62, 0.7, p.y) * smoothstep(0.95, 0.72, p.y);
  col += vec3(0.55, 0.66, 0.74) * (mistBand * smoothstep(0.35, 0.8, mist) * (0.11 + uHero * 0.12) + lowMist * water * 0.05);

  // The far, dark sky of the painting: the live sky's lights show through here.
  float open = smoothstep(0.1, 0.0, depth) * (1.0 - smoothstep(0.02, 0.2, sway)) * smoothstep(0.5, 0.3, p.y);
  gOpen = open;

  // The bank dissolves into fog at the bottom edge, and the top edge melts into the night.
  float edgeFog = fbm(vec2(p.x * 4.0 + t * 0.02, t * 0.03));
  float bottom = 1.0 - smoothstep(0.84 - edgeFog * 0.08, 1.0, p.y);
  float top = smoothstep(0.0, 0.08, p.y);
  float alpha = bottom * top;
  col += vec3(0.5, 0.6, 0.68) * (1.0 - bottom) * bottom * 0.5;

  return vec4(col, alpha);
}

void main() {
  float t = uTime;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);

  vec3 col = sky(vUv, aspect);

  // The illustration layer, offset by the journey. Over its own dark sky the
  // live sky's lights (stars, moon, aurora) are added, so the two read as one.
  vec2 p = uFocus + (vUv - vec2(0.0, uPlateY) - uFocus) * uSpan;
  if (p.y > -0.01 && p.y < 1.01) {
    vec4 layer = plate(clamp(p, 0.0, 1.0));
    vec3 lights = max(col - skyBase(vUv), 0.0);
    col = mix(col, layer.rgb + lights * gOpen, layer.a);
  }

  // Fireflies drift up through the whole night and lean toward the pointer.
  vec3 glow = vec3(0.0);
  vec2 sp = vec2(vUv.x * aspect.x, vUv.y);
  for (int i = 0; i < FIREFLIES; i++) {
    float fi = float(i);
    vec2 seed = vec2(hash(vec2(fi, 1.3)), hash(vec2(fi, 8.1)));
    float y = fract(seed.y - t * (0.004 + seed.x * 0.006) - uScrolled * (0.12 + seed.y * 0.2)) * 1.2 - 0.1;
    vec2 pos = vec2((0.04 + seed.x * 0.92) * aspect.x, y);
    pos += vec2(sin(t * (0.13 + seed.y * 0.12) + fi * 2.1), cos(t * (0.11 + seed.x * 0.1) + fi)) * vec2(0.05, 0.03);
    vec2 toward = vec2(uPointerScreen.x * aspect.x, uPointerScreen.y) - pos;
    pos += toward * uPointerOn * exp(-length(toward) * 5.0) * 0.45;
    vec2 d = sp - pos;
    float blink = pow(0.5 + 0.5 * sin(t * (0.7 + seed.x) + fi * 4.0), 3.0);
    glow += vec3(1.0, 0.86, 0.52) * (exp(-dot(d, d) * 26000.0) * 0.9 + exp(-dot(d, d) * 1600.0) * 0.06) * blink;
  }
  col += glow;

  // A faint lantern of moonlight follows the pointer.
  vec2 lp = (vUv - uPointerScreen) * aspect;
  col += vec3(0.45, 0.5, 0.62) * exp(-dot(lp, lp) * 22.0) * 0.04 * uPointerOn;

  // Grade: breathing exposure, intro fade and a soft vignette.
  vec2 v = vUv - 0.5;
  col *= (1.0 + sin(t * 0.35) * 0.025) * (1.0 - dot(v, v) * 0.55) * uIntro;

  gl_FragColor = vec4(col, 1.0);
}
`

export function mountLivingScene(
  canvas: HTMLCanvasElement,
  plate: HTMLImageElement,
  options: MountOptions,
): LivingScene {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
  if (!gl) {
    options.onFatal()
    return { destroy() {} }
  }

  const mobile = window.matchMedia('(max-width: 767px)').matches
  const program = link(gl, VERTEX, FRAGMENT(mobile))
  if (!program) {
    options.onFatal()
    return { destroy() {} }
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const loc = {
    plate: u('uPlate'),
    flow: u('uFlow'),
    res: u('uRes'),
    focus: u('uFocus'),
    span: u('uSpan'),
    img: u('uImg'),
    time: u('uTime'),
    intro: u('uIntro'),
    plateY: u('uPlateY'),
    scrolled: u('uScrolled'),
    page: u('uPage'),
    hero: u('uHero'),
    vel: u('uVel'),
    moon: u('uMoon'),
    moonVis: u('uMoonVis'),
    pointer: u('uPointer'),
    pointerScreen: u('uPointerScreen'),
    pointerOn: u('uPointerOn'),
    gust: u('uGust'),
    ripples: u('uRipples'),
  }

  const plateTex = texture(gl, plate)
  let flowTex: WebGLTexture | null = null
  gl.uniform1i(loc.plate, 0)
  gl.uniform1i(loc.flow, 1)
  gl.uniform2f(loc.img, plate.naturalWidth, plate.naturalHeight)

  let running = true
  let failed = false
  let loopOn = false
  let painted = false
  let frameId = 0
  let dpr = 1
  let width = 1
  let height = 1
  let lastPaint = 0
  const start = performance.now()

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, sx: 0.5, sy: 0.5, on: 0, onTarget: 0, gust: 0, lastX: 0, lastY: 0 }
  const ripples = new Float32Array(RIPPLES * 3).fill(-100)
  let rippleIndex = 0
  let nextDrop = 3
  let introStart = -1
  let span = { x: 1, y: 1 }
  let focus = { x: 0.6, y: 0.46 }
  let plateY = 0
  let lastScrolled = 0
  let velocity = 0

  const flowImage = new Image()
  flowImage.decoding = 'async'
  flowImage.onload = () => {
    if (!running) return
    flowTex = texture(gl, flowImage)
    wake()
  }
  flowImage.onerror = () => fail(new Error('flow map failed to load'))
  flowImage.src = FLOW_SRC

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)
    width = Math.max(1, Math.round(window.innerWidth * dpr))
    height = Math.max(1, Math.round(window.innerHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)
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
    if (!running || loopOn || document.hidden) return
    loopOn = true
    frameId = window.requestAnimationFrame(tick)
  }

  const drop = (x: number, y: number, at: number) => {
    ripples[rippleIndex * 3] = x
    ripples[rippleIndex * 3 + 1] = y
    ripples[rippleIndex * 3 + 2] = at
    rippleIndex = (rippleIndex + 1) % RIPPLES
  }

  /** Screen UV → plate UV, matching the shader. */
  const toPlate = (sx: number, sy: number) => ({
    x: focus.x + (sx - focus.x) * span.x,
    y: focus.y + (sy - plateY - focus.y) * span.y,
  })

  const tick = (now: number) => {
    loopOn = false
    if (!running || document.hidden) return
    loopOn = true
    frameId = window.requestAnimationFrame(tick)
    if (mobile && now - lastPaint < 30) return
    const dt = Math.min(0.05, (now - lastPaint) / 1000 || 0.016)
    lastPaint = now
    if (!flowTex) return
    try {
      const time = (now - start) / 1000
      const journey = options.getJourney()

      if (options.getReady() && introStart < 0) introStart = time
      const intro = introStart < 0 ? 0 : easeOutCubic(clamp((time - introStart) / 2.4, 0, 1))

      const k = 1 - Math.exp(-dt * 4)
      pointer.x += (pointer.tx - pointer.x) * k
      pointer.y += (pointer.ty - pointer.y) * k
      pointer.on += (pointer.onTarget - pointer.on) * (1 - Math.exp(-dt * 3))
      pointer.gust *= Math.exp(-dt * 1.6)

      const step = journey.scrolled - lastScrolled
      lastScrolled = journey.scrolled
      velocity += (step / dt - velocity) * (1 - Math.exp(-dt * 6))

      const narrow = width / dpr < 768
      focus = narrow ? { x: 0.82, y: 0.42 } : { x: 0.62, y: 0.46 }
      const overscan = 1.05 + (1 - intro) * 0.1 + journey.hero * 0.05
      const iw = plate.naturalWidth
      const ih = plate.naturalHeight
      const scale = Math.max(width / iw, height / ih) * overscan
      span = { x: width / (iw * scale), y: height / (ih * scale) }
      plateY = journey.plate

      // The moon rises from behind the treeline over the length of the page.
      const moon = {
        x: narrow ? 0.8 : 0.88,
        y: 0.5 - easeInOut(clamp(journey.page * 1.7, 0, 1)) * 0.38,
        r: narrow ? 0.04 : 0.045,
      }

      if (time > nextDrop) {
        drop(0.08 + Math.random() * 0.5, 0.7 + Math.random() * 0.24, time)
        nextDrop = time + 2.5 + Math.random() * 4
      }

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, plateTex)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, flowTex)
      gl.uniform2f(loc.res, width, height)
      gl.uniform2f(loc.focus, focus.x, focus.y)
      gl.uniform2f(loc.span, span.x, span.y)
      gl.uniform1f(loc.time, time)
      gl.uniform1f(loc.intro, intro)
      gl.uniform1f(loc.plateY, plateY)
      gl.uniform1f(loc.scrolled, journey.scrolled)
      gl.uniform1f(loc.page, journey.page)
      gl.uniform1f(loc.hero, journey.hero)
      gl.uniform1f(loc.vel, velocity)
      gl.uniform3f(loc.moon, moon.x, moon.y, moon.r)
      // It appears once the riverbank has drifted away, not through its fog.
      gl.uniform1f(loc.moonVis, clamp((Math.abs(journey.plate) - 0.7) / 0.5, 0, 1))
      gl.uniform2f(loc.pointer, pointer.x, pointer.y)
      gl.uniform2f(loc.pointerScreen, pointer.sx, pointer.sy)
      gl.uniform1f(loc.pointerOn, pointer.on)
      gl.uniform1f(loc.gust, Math.min(pointer.gust, 1.2))
      gl.uniform3fv(loc.ripples, ripples)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      if (!painted) {
        painted = true
        options.onFirstFrame()
      }
    } catch (error) {
      fail(error)
    }
  }

  const onMove = (event: PointerEvent) => {
    const sx = event.clientX / Math.max(1, window.innerWidth)
    const sy = event.clientY / Math.max(1, window.innerHeight)
    pointer.tx = (sx - 0.5) * 2
    pointer.ty = (sy - 0.5) * 2
    pointer.sx += (sx - pointer.sx) * 0.35
    pointer.sy += (sy - pointer.sy) * 0.35
    if (event.pointerType === 'mouse') pointer.onTarget = 1
    const speed = Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY)
    pointer.lastX = event.clientX
    pointer.lastY = event.clientY
    pointer.gust = Math.min(1.4, pointer.gust + speed * 0.0016)
  }
  const onLeave = () => {
    pointer.tx = 0
    pointer.ty = 0
    pointer.onTarget = 0
  }
  const onDown = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('a, button, [role="dialog"], input, textarea')) return
    const hit = toPlate(event.clientX / window.innerWidth, event.clientY / window.innerHeight)
    if (hit.y < 0 || hit.y > 1) return
    drop(hit.x, hit.y, (performance.now() - start) / 1000)
    pointer.gust = Math.min(1.4, pointer.gust + 0.6)
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    fail(new Error('WebGL context lost'))
  }

  const onVisibility = () => wake()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerdown', onDown)
  canvas.addEventListener('webglcontextlost', onLost)
  resize()
  wake()

  return {
    destroy() {
      running = false
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('webglcontextlost', onLost)
      flowImage.onload = null
      gl.deleteTexture(plateTex)
      if (flowTex) gl.deleteTexture(flowTex)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}

function texture(gl: WebGLRenderingContext, image: TexImageSource) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

function link(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }
  const vs = compile(gl.VERTEX_SHADER, vertex)
  const fs = compile(gl.FRAGMENT_SHADER, fragment)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  return program
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
