import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A chip row that scrolls sideways on phones instead of wrapping into many rows; from sm up it wraps.
 * Edges fade out while there's more to scroll that way, so it's clear the row continues.
 */
export function ScrollRow({ children }: { children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null)
  const [moreStart, setMoreStart] = useState(false)
  const [moreEnd, setMoreEnd] = useState(false)

  useEffect(() => {
    const el = row.current
    if (!el) {
      return
    }
    const update = () => {
      setMoreStart(el.scrollLeft > 4)
      setMoreEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    // Size changes of the row or its chips (rotation, genres loading in).
    const observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) {
      observer.observe(child)
    }
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [children])

  const fade = 'pointer-events-none absolute inset-y-0 w-10 transition-opacity duration-200 sm:hidden'
  return (
    <div className="relative -mx-4 -my-1 sm:m-0">
      {/* A scroll container clips its edges, so the padding leaves room for the chips' rings and focus outlines. */}
      <div
        ref={row}
        className="flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:p-0"
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`${fade} left-0 bg-linear-to-r from-ink-950 to-transparent ${moreStart ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        aria-hidden="true"
        className={`${fade} right-0 bg-linear-to-l from-ink-950 to-transparent ${moreEnd ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
