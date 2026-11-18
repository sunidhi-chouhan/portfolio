type Pad = {
  stop: () => void
}

let context: AudioContext | null = null
let pad: Pad | null = null

function audio() {
  context ??= new AudioContext()
  return context
}

export function chime() {
  const ctx = audio()
  void ctx.resume()
  const now = ctx.currentTime
  const tone = ctx.createOscillator()
  const gain = ctx.createGain()
  tone.type = 'sine'
  tone.frequency.setValueAtTime(520, now)
  tone.frequency.exponentialRampToValueAtTime(780, now + 0.08)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)
  tone.connect(gain)
  gain.connect(ctx.destination)
  tone.start(now)
  tone.stop(now + 0.4)
}

export function setAmbience(on: boolean) {
  if (!on) {
    pad?.stop()
    pad = null
    return
  }
  if (pad) return

  const ctx = audio()
  void ctx.resume()
  const low = ctx.createOscillator()
  const high = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  low.type = 'sine'
  high.type = 'sine'
  low.frequency.value = 110
  high.frequency.value = 164.81
  filter.type = 'lowpass'
  filter.frequency.value = 420
  gain.gain.value = 0.015
  low.connect(filter)
  high.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  low.start()
  high.start()

  let stopped = false
  pad = {
    stop() {
      if (stopped) return
      stopped = true
      const now = ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now)
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.2)
      low.stop(now + 0.25)
      high.stop(now + 0.25)
    },
  }
}
