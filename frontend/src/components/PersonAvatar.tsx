import type { Person } from '../api/types'
import { personInfo } from '../people'

const SIZES = {
  sm: 'size-6 text-sm',
  md: 'size-9 text-lg',
  lg: 'size-12 text-2xl',
} as const

type Props = {
  person: Person
  size?: keyof typeof SIZES
}

/** The person's emoji in a circle tinted with their color. */
export function PersonAvatar({ person, size = 'md' }: Props) {
  const info = personInfo(person)
  return (
    <span
      role="img"
      aria-label={info.name}
      className={`inline-grid shrink-0 place-items-center rounded-full ring-1 ${info.softBgClass} ${info.ringClass} ${SIZES[size]}`}
    >
      {info.emoji}
    </span>
  )
}
