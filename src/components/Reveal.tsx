import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '../lib/reduced-motion.ts'

type RevealProps = {
  children: ReactNode
  className?: string
  lite?: boolean
  delay?: number
  marker?: string
}

export function Reveal({ children, className, lite = false, delay = 0, marker }: RevealProps) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShown(true)
        observer.disconnect()
      },
      { threshold: 0.28 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])

  const motionClass = reduced ? '' : shown ? 'reveal-in' : `reveal-arm${lite ? ' reveal-lite' : ''}`

  return (
    <div
      ref={ref}
      className={[className, motionClass].filter(Boolean).join(' ')}
      data-idea={marker}
      style={shown && !reduced && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
