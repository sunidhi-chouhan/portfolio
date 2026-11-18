import { site } from '../content/site.ts'
import { Reveal } from './Reveal.tsx'

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section-offset relative px-5 py-24 sm:px-8 md:py-32">
      <div className="relative mx-auto min-w-0 max-w-6xl">
        <Reveal>
          <p className="text-xs tracking-[0.22em] text-violet uppercase">About</p>
          <h2 id="about-title" className="mt-6 max-w-4xl font-display text-[clamp(1.75rem,8vw,3rem)] leading-[0.95] break-words text-sand sm:text-6xl lg:text-7xl">
            {site.aboutHeadline}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed font-light text-sand">{site.aboutIntro}</p>
        </Reveal>
        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-4" lite delay={0.28}>
            <h3 className="font-display text-[clamp(1.6rem,8vw,2.25rem)] break-words text-sand">{site.identityTitle}</h3>
            <dl className="mt-8">
              {site.identity.map((fact) => (
                <div key={fact.label} className="border-t border-sand/15 py-4">
                  <dt className="text-xs tracking-[0.18em] text-muted uppercase">{fact.label}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-sand">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-2 lg:col-span-8 lg:pt-2">
            {site.about.map((block, index) => (
              <Reveal key={block.heading} lite delay={0.4 + index * 0.12}>
                <h3 className="font-display text-[clamp(1.6rem,8vw,2.25rem)] break-words text-sand">{block.heading}</h3>
                <p className="mt-5 text-base leading-relaxed font-light text-muted">{block.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
