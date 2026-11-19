import { getLenis } from './smooth-scroll.ts'

export function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lenis = getLenis()
  if (lenis && !reduce) {
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0
    lenis.scrollTo(section, {
      offset: -margin,
      duration: 1.6,
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    })
  } else {
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  const heading = section.querySelector('h1, h2')
  if (heading instanceof HTMLElement) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
}
