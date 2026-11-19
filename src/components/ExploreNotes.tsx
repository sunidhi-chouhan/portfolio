import { site } from '../content/site.ts'
import { Reveal } from './Reveal.tsx'
import { SplitText } from './SplitText.tsx'

export function ExploreNotes() {
  return (
    <section id="explore" aria-labelledby="explore-title" className="section-offset relative z-10 px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto min-w-0 max-w-6xl">
        <Reveal>
          <p className="shine text-xs tracking-[0.22em] text-violet uppercase">{site.exploreEyebrow}</p>
          <h2 id="explore-title" className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,8vw,3rem)] leading-[0.95] break-words text-sand sm:text-6xl">
            <SplitText text={site.exploreTitle} baseDelay={0.1} />
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-muted">{site.exploreLead}</p>
        </Reveal>
        {site.explore.length === 0 ? (
          <p className="mt-16 text-base text-muted">No notes yet. Add them in the content file.</p>
        ) : (
          <ul className="mt-14 grid gap-x-16 sm:grid-cols-2">
            {site.explore.map((note, index) => (
              <li key={note.id}>
                <article data-spotlight className="spotlight h-full border-t border-sand/15 px-1 py-8 sm:px-5 sm:py-10">
                  <p className="text-xs tracking-[0.2em] text-violet uppercase">
                    {String(index + 1).padStart(2, '0')}
                    <span className="px-3 text-sand/30">/</span>
                    {note.label}
                  </p>
                  <h3 className="mt-4 max-w-md font-display text-[clamp(1.45rem,6vw,2.25rem)] break-words text-sand sm:text-4xl">{note.title}</h3>
                  <p className="mt-4 max-w-xl text-base leading-relaxed font-light text-muted">{note.body}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
