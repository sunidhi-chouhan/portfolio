import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { site } from './content/site.ts'
import { chime, setAmbience } from './lib/sound.ts'
import { scrollToSection } from './lib/scroll.ts'
import { About } from './components/About.tsx'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Contact } from './components/Contact.tsx'
import { ExploreNotes } from './components/ExploreNotes.tsx'
import { Grain } from './components/Grain.tsx'
import { Header } from './components/Header.tsx'
import { Hero } from './components/Hero.tsx'
import { WorkList } from './components/WorkList.tsx'

const WorkPanel = lazy(() =>
  import('./components/WorkPanel.tsx').then((mod) => ({ default: mod.WorkPanel })),
)
const year = new Date().getFullYear()

export default function App() {
  const [discovered, setDiscovered] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [panelReady, setPanelReady] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const workOpener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (activeId) setPanelReady(true)
  }, [activeId])

  useEffect(() => {
    setAmbience(soundOn)
    return () => setAmbience(false)
  }, [soundOn])

  const active = site.works.find((work) => work.id === activeId) ?? null

  function openWork(id: string, opener: HTMLElement) {
    workOpener.current = opener
    setActiveId(id)
    setDiscovered((current) => (current.includes(id) ? current : [...current, id]))
    if (soundOn) chime()
  }

  return (
    <div className="bg-ink text-sand">
      <Atmosphere />
      <a
        href="#main"
        className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-4 z-[90] -translate-y-24 rounded-md bg-sand px-4 py-3 text-sm text-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      <a
        href="#work"
        className="fixed top-[calc(env(safe-area-inset-top)+4rem)] left-4 z-[90] -translate-y-40 rounded-md bg-sand px-4 py-3 text-sm text-ink focus:translate-y-0"
        onClick={(event) => {
          event.preventDefault()
          scrollToSection('work')
        }}
      >
        Skip to work
      </a>
      <Grain />
      <Header soundOn={soundOn} onToggleSound={() => setSoundOn((on) => !on)} />
      <main id="main" className="relative z-10" tabIndex={-1}>
        <Hero />
        <About />
        <WorkList discovered={discovered} onOpen={openWork} />
        <ExploreNotes />
        <Contact />
      </main>
      <footer className="relative z-10 border-t border-sand/10 px-5 py-8 text-sm text-muted sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>
            © {year} · {site.name}
          </p>
          <p>{site.footer}</p>
        </div>
      </footer>
      {panelReady ? (
        <Suspense fallback={null}>
          <WorkPanel work={active} returnFocusRef={workOpener} onClose={() => setActiveId(null)} />
        </Suspense>
      ) : null}
    </div>
  )
}
