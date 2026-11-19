import { site } from '../content/site.ts'
import { ProjectShowcase } from './ProjectShowcase.tsx'
import { Reveal } from './Reveal.tsx'
import { SplitText } from './SplitText.tsx'

type WorkListProps = {
  discovered: readonly string[]
  onOpen: (id: string, opener: HTMLElement) => void
}

export function WorkList({ discovered, onOpen }: WorkListProps) {
  return (
    <section id="work" aria-labelledby="work-title" className="section-offset relative z-10 px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto min-w-0 max-w-6xl">
        <Reveal>
          <p className="shine text-xs tracking-[0.22em] text-violet uppercase">{site.workEyebrow}</p>
          <h2 id="work-title" className="mt-4 font-display text-[clamp(1.75rem,8vw,3rem)] break-words text-sand sm:text-7xl"><SplitText text={site.workTitle} by="char" baseDelay={0.1} step={0.04} />
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-muted">{site.workLead}</p>
        </Reveal>
        {site.works.length === 0 ? (
          <p className="mt-16 border-t border-sand/15 pt-10 text-base text-muted">
            No studies yet. Add them in the content file.
          </p>
        ) : (
          <div className="mt-12">
            {site.works.map((work, index) => (
              <ProjectShowcase
                key={work.id}
                work={work}
                seen={discovered.includes(work.id)}
                reverse={index % 2 === 1}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
