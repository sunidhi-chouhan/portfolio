import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function mountHeroPin(section: HTMLElement, onProgress: (progress: number) => void) {
  const context = gsap.context(() => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () =>
        `+=${Math.round(window.innerHeight * (window.matchMedia('(max-width: 767px)').matches ? 1.05 : 1.65))}`,
      pin: true,
      scrub: 0.45,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgress(self.progress),
    })
  }, section)
  return () => context.revert()
}
