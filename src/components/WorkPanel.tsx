import * as Dialog from '@radix-ui/react-dialog'
import type { RefObject } from 'react'
import type { Work } from '../content/site.ts'

type WorkPanelProps = {
  work: Work | null
  onClose: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}

export function WorkPanel({ work, onClose, returnFocusRef }: WorkPanelProps) {
  return (
    <Dialog.Root
      open={work !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/80" />
        {work ? (
          <Dialog.Content
            aria-modal="true"
            className="panel-in fixed inset-y-0 right-0 z-50 w-full max-w-full overflow-y-auto bg-charcoal px-6 py-16 sm:px-10 md:max-w-xl lg:max-w-2xl"
            onCloseAutoFocus={(event) => {
              const opener = returnFocusRef.current
              if (!opener?.isConnected) return
              event.preventDefault()
              opener.focus({ preventScroll: true })
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <p className="text-xs tracking-[0.2em] text-muted uppercase">
                {work.index} · {work.place}
              </p>
              <Dialog.Close className="min-h-11 px-2 text-xs tracking-[0.18em] text-sand uppercase">
                Close
              </Dialog.Close>
            </div>
            {work.image ? (
              <div className="mt-8 aspect-[16/10] w-full bg-[#0c1524]">
                <picture className="block h-full w-full">
                  <source srcSet={work.image.replace(/\.jpe?g$/i, '.webp')} type="image/webp" />
                  <img
                    src={work.image}
                    alt={`${work.title} screenshot`}
                    width={1024}
                    height={540}
                    className="h-full w-full object-contain object-center"
                  />
                </picture>
              </div>
            ) : null}
            <Dialog.Title className="mt-8 max-w-full font-display text-[clamp(2rem,10vw,3.75rem)] leading-[0.9] break-words text-sand sm:text-6xl">
              {work.title}
            </Dialog.Title>
            <Dialog.Description className="mt-6 max-w-lg text-lg font-light text-muted">
              {work.summary}
            </Dialog.Description>
            <p className="mt-6 text-sm tracking-[0.16em] text-sand uppercase">
              {work.role}
              <span className="px-2 text-sand/30">·</span>
              {work.status}
            </p>
            {work.stack.length > 0 ? (
              <>
                <h3 className="mt-10 text-xs tracking-[0.2em] text-muted uppercase">Stack</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {work.stack.map((item) => (
                    <li key={item} className="border border-sand/20 px-3 py-2 text-xs tracking-[0.16em] text-sand uppercase">
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-10 text-xl leading-snug text-moon">{work.metric}</p>
            <p className="mt-2 text-xs tracking-[0.18em] text-muted uppercase">Challenge</p>
            {work.did.length > 0 ? (
              <>
                <h3 className="mt-10 text-xs tracking-[0.2em] text-muted uppercase">What changed</h3>
                <ul className="mt-4 space-y-3 text-base text-sand">
                  {work.did.map((item) => (
                    <li key={item} className="border-t border-sand/15 pt-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {work.href ? (
              <a
                href={work.href}
                className="mt-10 inline-flex min-h-11 items-center text-sm tracking-[0.18em] text-sand uppercase"
                {...(work.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              >
                {/construction/i.test(work.status) ? 'View project' : 'Live project'}
                <span className="sr-only">, opens in a new tab</span>
              </a>
            ) : null}
          </Dialog.Content>
        ) : null}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
