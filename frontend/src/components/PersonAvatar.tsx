import type { Person } from '../api/types'
import { personInfo } from '../people'

const SIZES = {
  xs: 'size-5 text-xs',
  sm: 'size-6 text-sm',
  md: 'size-9 text-lg',
  lg: 'size-12 text-2xl',
} as const

type Props = {
  person: Person
  size?: keyof typeof SIZES
  /** Hidden from screen readers: for avatars right next to the person's name (or a label with it). */
  decorative?: boolean
}

/** The person's emoji in a circle tinted with their color. */
export function PersonAvatar({ person, size = 'md', decorative = false }: Props) {
  const info = personInfo(person)
  return (
    <span
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': info.name })}
      className={`inline-grid shrink-0 place-items-center rounded-full ring-1 ${info.softBgClass} ${info.ringClass} ${SIZES[size]}`}
    >
      {info.emoji}
    </span>
  )
}
