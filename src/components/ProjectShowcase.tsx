import type { Work } from '../content/site.ts'

type ProjectShowcaseProps = {
  work: Work
  seen: boolean
  reverse: boolean
  onOpen: (id: string, opener: HTMLElement) => void
}

export function ProjectShowcase({ work, seen, reverse, onOpen }: ProjectShowcaseProps) {
  return (
    <article className="group border-t border-sand/15 py-12 first:border-t-0 first:pt-2 md:py-16">
      <div className={`grid items-center gap-8 lg:grid-cols-12 lg:gap-16 ${reverse ? 'lg:[&>div:first-child]:order-2' : ''}`}>
        <div className="lg:col-span-7">
          <ProjectPlate work={work} />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">
            {work.index}
            {seen ? <span className="ml-3 text-moon">Opened</span> : null}
          </p>
          <h3 className="mt-3 max-w-full font-display text-[clamp(1.75rem,8vw,3.75rem)] leading-[0.92] break-words text-sand">
            {work.title}
          </h3>
          <p className="mt-5 max-w-full text-sm tracking-[0.16em] break-words text-violet uppercase">
            {work.role}
            <span className="px-2 text-sand/30">·</span>
            {work.status}
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed font-light text-muted">{work.summary}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {work.stack.map((item) => (
              <li key={item} className="border border-sand/20 px-3 py-2 text-xs tracking-[0.16em] text-muted uppercase">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs tracking-[0.18em] text-muted uppercase">Challenge</p>
          <p className="mt-2 text-lg leading-snug text-moon">{work.metric}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center border-b border-sand/40 text-sm tracking-[0.18em] text-sand uppercase hover:border-sand hover:text-moon"
              aria-label={`Open study: ${work.title}`}
              onClick={(event) => onOpen(work.id, event.currentTarget)}
            >
              Open study
            </button>
            {work.href ? (
              <a
                href={work.href}
                className="inline-flex min-h-11 items-center text-sm tracking-[0.18em] text-muted uppercase hover:text-sand"
                {...externalProps(work.href)}
              >
                {linkLabel(work.status)}
                <span className="sr-only">, opens in a new tab</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function ProjectPlate({ work }: { work: Work }) {
  return (
    <div
      data-destination={work.id}
      className="relative aspect-[16/10] overflow-hidden bg-[#0c1524] [mask-image:linear-gradient(180deg,transparent,black_2%,black_98%,transparent)]"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-1/3 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(243,234,208,0.16),transparent)] transition duration-700 ease-out group-hover:translate-x-[280%] motion-reduce:transition-none" />
      {work.image ? (
        <picture className="block h-full w-full">
          <source srcSet={webpSrc(work.image)} type="image/webp" />
          <img
            src={work.image}
            alt={`${work.title} screenshot`}
            width={1024}
            height={540}
            loading="lazy"
            className="h-full w-full object-contain object-center transition duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </picture>
      ) : (
        <PlateArt index={work.index} />
      )}
      <p
        className={`absolute bottom-4 left-4 z-[2] text-xs tracking-[0.2em] uppercase ${
          work.image ? 'bg-ink/80 px-2 py-1 text-sand' : 'text-sand/80'
        }`}
      >
        {work.place}
      </p>
      {work.image ? null : (
        <p className="absolute top-4 left-4 text-xs tracking-[0.18em] text-sand/70 uppercase">Drawing stand-in</p>
      )}
      {work.image ? null : (
        <p aria-hidden="true" className="pointer-events-none absolute right-3 bottom-0 font-display text-8xl leading-none text-sand/20 sm:text-9xl">
          {work.index}
        </p>
      )}
    </div>
  )
}

function PlateArt({ index }: { index: string }) {
  const variant = Number(index) % 3
  return (
    <svg
      viewBox="0 0 160 100"
      className="h-full w-full transition duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="160" height="100" fill="#0c1524" />
      {variant === 1 ? <Ridges /> : variant === 2 ? <Willow /> : <River />}
    </svg>
  )
}

function River() {
  return (
    <>
      <rect width="160" height="58" fill="#12243a" />
      <circle cx="118" cy="24" r="14" fill="#f3ead0" />
      <circle cx="118" cy="24" r="22" fill="#f3ead0" opacity="0.15" />
      <path d="M0 58 C28 50 48 66 80 58 C112 50 132 64 160 56 L160 100 L0 100 Z" fill="#12343a" />
      <path d="M0 70 C40 64 70 78 110 70 C132 66 146 72 160 68" fill="none" stroke="#f0e2b0" strokeOpacity="0.35" />
      <path d="M18 78 C48 74 70 84 108 78" fill="none" stroke="#d5ebe8" strokeOpacity="0.28" />
    </>
  )
}

function Ridges() {
  return (
    <>
      <rect width="160" height="100" fill="#101c30" />
      <circle cx="36" cy="28" r="12" fill="#f6edd2" />
      <path d="M0 78 L18 48 L34 66 L58 36 L78 62 L104 32 L128 58 L160 40 L160 100 L0 100 Z" fill="#152033" />
      <path d="M0 86 L24 64 L46 78 L74 52 L98 74 L126 58 L160 72 L160 100 L0 100 Z" fill="#0d1828" />
      <path d="M48 100 C62 78 78 82 92 100" fill="#1c4a52" />
    </>
  )
}

function Willow() {
  return (
    <>
      <rect width="160" height="62" fill="#102038" />
      <circle cx="108" cy="26" r="13" fill="#f4ead2" />
      <path d="M0 64 C30 58 54 72 90 64 C120 58 140 70 160 62 L160 100 L0 100 Z" fill="#123832" />
      <path d="M28 18 C34 40 22 58 30 78" fill="none" stroke="#6d8f72" strokeWidth="1.4" />
      <path d="M36 14 C46 38 30 60 40 82" fill="none" stroke="#8eae8a" strokeWidth="1.2" />
      <path d="M44 20 C40 44 52 62 46 84" fill="none" stroke="#6d8f72" strokeWidth="1" />
      <path d="M22 24 C16 46 24 64 18 80" fill="none" stroke="#4f7358" strokeWidth="1" />
    </>
  )
}

function webpSrc(src: string) {
  return src.replace(/\.jpe?g$/i, '.webp')
}

function linkLabel(status: string) {
  return /construction/i.test(status) ? 'View project' : 'Live project'
}

function externalProps(href: string) {
  if (!href.startsWith('http')) return {}
  return { target: '_blank', rel: 'noreferrer noopener' } as const
}
