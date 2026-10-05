import { useRef, useState, type KeyboardEvent } from 'react'
import type { Person, Stars } from '../api/types'
import { personInfo } from '../people'
import { PersonAvatar } from './PersonAvatar'
import { StarIcon } from './StarIcon'

const MAX_STARS = 5

const SIZES = {
  xs: { star: 'size-5', button: 'p-0.5', avatar: 'xs', gap: 'gap-1' },
  sm: { star: 'size-6', button: 'p-0.5', avatar: 'sm', gap: 'gap-2' },
  md: { star: 'size-8', button: 'p-1', avatar: 'md', gap: 'gap-3' },
} as const

type Props = {
  person: Person
  value: Stars
  onChange: (value: Stars) => void
  size?: keyof typeof SIZES
  /** Shown before the stars; defaults to "<Name>'s stars". */
  label?: string
  showName?: boolean
}

/**
 * 1–5 stars in the person's color. Tap a star to set it, tap the current one again to clear.
 * Hovering (mouse only) previews the result: hovering the current star shows all stars empty with a ×.
 */
export function StarRating({ person, value, onChange, size = 'md', label, showName = false }: Props) {
  const info = personInfo(person)
  const [hovered, setHovered] = useState<number | null>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const previewClear = hovered !== null && hovered === value
  const shown = previewClear ? 0 : (hovered ?? value ?? 0)
  const sizes = SIZES[size]

  function select(stars: number) {
    onChange(stars === value ? null : stars)
    // Show the new value under the pointer, not a "clear" preview right after setting it;
    // the preview comes back once the pointer re-enters a star.
    setHovered(null)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]
    if (delta === undefined) {
      return
    }
    event.preventDefault()
    const next = Math.min(MAX_STARS, Math.max(1, (value ?? 0) + delta))
    onChange(next)
    buttons.current[next - 1]?.focus()
  }

  return (
    <div className={`flex items-center ${sizes.gap}`}>
      <PersonAvatar person={person} size={sizes.avatar} />
      {showName && <span className={`w-14 text-sm font-semibold ${info.textClass}`}>{info.name}</span>}
      <div
        role="radiogroup"
        aria-label={label ?? `${info.name}'s stars`}
        className={`flex ${info.textClass}`}
        onPointerLeave={() => setHovered(null)}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: MAX_STARS }, (_, i) => {
          const stars = i + 1
          const checked = value === stars
          return (
            <button
              key={stars}
              ref={(el) => {
                buttons.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${stars} star${stars === 1 ? '' : 's'}${checked ? ', press again to clear' : ''}`}
              // Roving tabindex: one tab stop for the group, arrows move inside it.
              tabIndex={checked || (value === null && stars === 1) ? 0 : -1}
              onClick={() => select(stars)}
              // Mouse only: touch has no real hover, and an emulated one would stick after a tap.
              onPointerEnter={(e) => setHovered(e.pointerType === 'mouse' ? stars : null)}
              className={`relative rounded-md transition-transform hover:scale-115 active:scale-95 ${sizes.button}`}
            >
              <StarIcon filled={stars <= shown} className={`transition-opacity ${sizes.star}`} />
              {previewClear && checked && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center text-xs leading-none font-bold text-muted"
                >
                  ×
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
