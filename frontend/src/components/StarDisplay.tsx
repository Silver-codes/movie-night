import type { Person, Stars } from '../api/types'
import { personInfo } from '../people'
import { PersonAvatar } from './PersonAvatar'
import { StarIcon } from './StarIcon'

/** Compact read-only stars for cards: avatar + 5 small stars, or a dash when unrated. */
export function StarDisplay({ person, value }: { person: Person; value: Stars }) {
  const info = personInfo(person)
  return (
    <div className="flex items-center gap-1.5">
      <PersonAvatar person={person} size="xs" />
      {value === null ? (
        <span className="text-xs text-faint">not rated</span>
      ) : (
        <span role="img" aria-label={`${info.name}: ${value} of 5 stars`} className={`flex ${info.textClass}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} filled={i < value} className="size-3.5" />
          ))}
        </span>
      )}
    </div>
  )
}
