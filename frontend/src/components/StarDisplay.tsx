import type { Person, Stars } from '../api/types'
import { usePersonInfo } from '../people'
import { PersonAvatar } from './PersonAvatar'
import { StarIcon } from './StarIcon'

// sm: cards. md: the podium, bigger on laptops/TVs. lg: the winner, readable from the couch (adds the name).
const SIZES = {
  sm: { avatar: 'xs', star: 'size-3.5', text: 'text-xs', gap: 'gap-1.5' },
  md: { avatar: 'stageSm', star: 'size-3.5 lg:size-5', text: 'text-xs lg:text-base', gap: 'gap-1.5 lg:gap-2' },
  lg: { avatar: 'stage', star: 'size-5 lg:size-7', text: 'text-sm lg:text-lg', gap: 'gap-2 lg:gap-3' },
} as const

type Props = {
  person: Person
  value: Stars
  size?: keyof typeof SIZES
}

/** Compact read-only stars: avatar + 5 stars, or "not rated". */
export function StarDisplay({ person, value, size = 'sm' }: Props) {
  const info = usePersonInfo(person)
  const s = SIZES[size]
  return (
    <div className={`flex items-center ${s.gap}`}>
      <PersonAvatar person={person} size={s.avatar} decorative />
      {size === 'lg' && (
        <span aria-hidden="true" className={`font-semibold ${s.text} ${info.textClass}`}>
          {info.name}
        </span>
      )}
      {value === null ? (
        <span className={`${s.text} text-muted`}>
          <span className="sr-only">{info.name}: </span>not rated
        </span>
      ) : (
        <span role="img" aria-label={`${info.name}: ${value} of 5 stars`} className={`flex ${info.textClass}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} filled={i < value} className={s.star} />
          ))}
        </span>
      )}
    </div>
  )
}
