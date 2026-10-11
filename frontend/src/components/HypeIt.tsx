import type { useHypeStars } from '../lib/hypeStars'
import { PEOPLE } from '../people'
import { StarRating } from './StarRating'

type Props = ReturnType<typeof useHypeStars>

/** "Hype it?" with full-size stars and each person's name (the phone sheet and the Search drawer). */
export function HypeItSection({ stars, setStar, anyRated }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-ink-950/60 p-4 ring-1 ring-ink-700">
      <h3 className="font-sans text-sm font-semibold tracking-wide text-muted uppercase">Hype it?</h3>
      {PEOPLE.map((person) => (
        <StarRating
          key={person.id}
          person={person.id}
          showName
          value={stars[person.id]}
          onChange={(value) => setStar(person.id, value)}
        />
      ))}
      <p className="text-xs text-faint">
        {anyRated ? 'Tap a star again to clear it.' : 'Optional: you can rate it later from the watchlist.'}
      </p>
    </section>
  )
}
