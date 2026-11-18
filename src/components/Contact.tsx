import { site } from '../content/site.ts'
import { Reveal } from './Reveal.tsx'

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="section-offset relative min-h-svh">
      <div className="relative z-10 flex min-h-svh items-end px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <Reveal>
            <p className="text-xs tracking-[0.22em] text-moon uppercase">Contact</p>
            <h2 id="contact-title" className="mt-5 max-w-3xl font-display text-[clamp(1.85rem,9vw,3rem)] leading-[0.95] break-words text-sand sm:text-7xl">{site.contact.title}</h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed font-light text-sand/90">{site.contact.body}</p>
            <ul className="mt-12 grid gap-8 sm:grid-cols-2">
              {site.links.map((link) => {
                const external = link.href.startsWith('http')
                const email = link.href.startsWith('mailto:')
                const at = email ? site.email.indexOf('@') : -1
                const value = email ? site.email : link.label
                return (
                  <li key={link.label} className={email ? '@container min-w-0' : undefined}>
                    <a
                      href={link.href}
                      className="group block min-h-11 min-w-0"
                      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      {...(email ? { 'aria-label': `Email ${site.email}` } : {})}
                    >
                      <span className="text-xs tracking-[0.2em] text-muted uppercase">
                        {link.label}
                        {external ? <span className="sr-only">, opens in a new tab</span> : null}
                      </span>
                      <span
                        aria-hidden={external && value === link.label ? true : undefined}
                        className={`mt-2 block font-display text-sand group-hover:text-moon ${
                          email
                            ? 'text-[clamp(1.75rem,11cqi,2.75rem)] leading-normal break-words'
                            : 'text-4xl sm:text-5xl'
                        }`}
                      >
                        {email && at > 0 ? (
                          <>
                            {site.email.slice(0, at + 1)}<wbr />{site.email.slice(at + 1)}
                          </>
                        ) : (
                          value
                        )}
                      </span>
                    </a>
                  </li>
                )
              })}
              {site.resume.href ? (
                <li>
                  <a href={site.resume.href} className="group block min-h-11">
                    <span className="text-xs tracking-[0.2em] text-muted uppercase">Resume</span>
                    <span
                      aria-hidden={site.resume.title.toLowerCase() === 'resume' ? true : undefined}
                      className="mt-2 block font-display text-4xl text-sand group-hover:text-moon sm:text-5xl"
                    >
                      {site.resume.title}
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
