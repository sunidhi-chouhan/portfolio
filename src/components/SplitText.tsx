import type { CSSProperties } from 'react'

type SplitTextProps = {
  text: string
  /** Split into words (headings) or characters (the hero name). */
  by?: 'word' | 'char'
  className?: string
  /** Seconds before the first piece moves. */
  baseDelay?: number
  /** Seconds between pieces. */
  step?: number
}

/**
 * Renders text as masked pieces that rise into place. Screen readers get the
 * plain string; the pieces are hidden from them. CSS drives the motion:
 * `.split-piece` waits until an ancestor is revealed (see index.css).
 */
export function SplitText({ text, by = 'word', className, baseDelay = 0, step = 0.06 }: SplitTextProps) {
  const words = text.split(' ')
  // Running piece number for each word's first piece, so delays flow across words.
  const starts = words.map((_, w) =>
    words.slice(0, w).reduce((sum, word) => sum + (by === 'char' ? [...word].length : 1), 0),
  )
  const piece = (content: string, key: string, index: number) => {
    const style = { '--split-delay': `${(baseDelay + index * step).toFixed(3)}s` } as CSSProperties
    return (
      <span key={key} className="split-mask">
        <span className="split-piece" style={style}>
          {content}
        </span>
      </span>
    )
  }

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={['split', className].filter(Boolean).join(' ')}>
        {words.map((word, w) => (
          <span key={w} className="split-word">
            {by === 'char'
              ? [...word].map((char, c) => piece(char, `${w}-${c}`, (starts[w] ?? 0) + c))
              : piece(word, `${w}`, starts[w] ?? 0)}
            {w < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </>
  )
}
