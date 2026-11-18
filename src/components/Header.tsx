import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { site } from '../content/site.ts'
import { scrollToSection } from '../lib/scroll.ts'

const NAV = [
  { href: '#about', id: 'about', label: 'About' },
  { href: '#work', id: 'work', label: 'Work' },
  { href: '#contact', id: 'contact', label: 'Contact' },
] as const

type HeaderProps = {
  soundOn: boolean
  onToggleSound: () => void
}

export function Header({ soundOn, onToggleSound }: HeaderProps) {
  const [current, setCurrent] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(item.id)).filter(
      (section): section is HTMLElement => section !== null,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setCurrent(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0.15, 0.4] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const menu = document.getElementById('site-menu')
    menu?.querySelector<HTMLAnchorElement>('a')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButtonRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const close = () => {
      if (query.matches) setOpen(false)
    }
    query.addEventListener('change', close)
    return () => query.removeEventListener('change', close)
  }, [])

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }

  const linkClass = 'inline-flex min-h-11 items-center text-xs tracking-[0.18em] uppercase'

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 bg-ink/85 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          className={`${linkClass} text-sand sm:hidden`}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`${linkClass} ${current === item.id ? 'text-sand' : 'text-muted hover:text-sand'}`}
              aria-current={current === item.id ? 'location' : undefined}
              onClick={(event) => navigate(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            className="hidden min-h-11 items-center text-xs tracking-[0.18em] text-muted uppercase hover:text-sand sm:inline-flex"
            aria-pressed={soundOn}
            onClick={onToggleSound}
          >
            Sound {soundOn ? 'on' : 'off'}
          </button>
          {site.resume.href ? (
            <a href={site.resume.href} className={`${linkClass} text-sand`}>
              Resume
            </a>
          ) : null}
        </div>
      </div>
      <nav
        id="site-menu"
        aria-label="Sections"
        className={open ? 'absolute inset-x-0 top-full border-t border-sand/10 bg-charcoal px-5 py-4 sm:hidden' : 'hidden'}
      >
        <ul className="flex flex-col">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                  href={item.href}
                  className={`flex min-h-14 items-center font-display text-[clamp(1.7rem,11vw,2.25rem)] leading-none break-words ${
                    current === item.id ? 'text-moon' : 'text-sand'
                  }`}
                  aria-current={current === item.id ? 'location' : undefined}
                  onClick={(event) => navigate(event, item.id)}
                >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={`${linkClass} text-sand`}
              aria-pressed={soundOn}
              onClick={onToggleSound}
            >
              Sound {soundOn ? 'on' : 'off'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}
