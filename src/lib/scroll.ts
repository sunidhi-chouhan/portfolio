export function scrollToSection(id: string) {
  const section = document.getElementById(id)
  if (!section) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  const heading = section.querySelector('h1, h2')
  if (heading instanceof HTMLElement) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
}
