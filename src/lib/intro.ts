/**
 * Coordinates the opening sequence: the loader waits for a few milestones,
 * then marks the page ready. CSS keys the hero entrance off
 * `html[data-ready]`, and the WebGL scene reads `isReady()` to fade in.
 */

export type Milestone = 'fonts' | 'plate' | 'scene'

const MILESTONES: readonly Milestone[] = ['fonts', 'plate', 'scene']
const done = new Set<Milestone>()
let ready = false

export function reportLoaded(milestone: Milestone) {
  if (done.has(milestone)) return
  done.add(milestone)
}

export function loadedShare() {
  return done.size / MILESTONES.length
}

export function markReady() {
  if (ready) return
  ready = true
  document.documentElement.dataset.ready = 'true'
}

export function isReady() {
  return ready
}

/** The night canvas: 'idle' until it paints, 'painted' once live, 'down' if WebGL failed. */
export type SceneState = 'idle' | 'painted' | 'down'

let sceneState: SceneState = 'idle'
const sceneListeners = new Set<() => void>()

export function setSceneState(next: SceneState) {
  if (sceneState === next) return
  sceneState = next
  sceneListeners.forEach((listener) => listener())
}

export function getSceneState() {
  return sceneState
}

export function subscribeScene(listener: () => void) {
  sceneListeners.add(listener)
  return () => {
    sceneListeners.delete(listener)
  }
}
