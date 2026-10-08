import { useState } from 'react'
import type { HistoryStats as Stats } from '../api/types'
import { formatStars } from '../lib/format'
import { usePeople, type PersonInfo } from '../people'
import { PeopleSettingsModal } from './PeopleSettingsModal'
import { PersonAvatar } from './PersonAvatar'
import { StatTile } from './StatTile'

type Props = {
  stats: Stats
  onOpenMovie: (id: number) => void
}

const big = 'font-display text-3xl leading-none font-semibold'
const title = 'line-clamp-2 font-semibold leading-snug'
const none = <span className="text-2xl text-faint">—</span>

/** "Tougher critic" line, once both have rated something. */
function criticLine(stats: Stats, people: PersonInfo[]): string | null {
  const [a, b] = people.map((p) => stats.people[p.id].average_verdict)
  if (a === null || b === null) {
    return null
  }
  if (Math.abs(a - b) < 0.05) {
    return 'Perfectly in sync'
  }
  const tougher = a < b ? people[0] : people[1]
  return `${tougher.name} is the tougher critic`
}

/** The stats strip at the top of History. */
export function HistoryStats({ stats, onOpenMovie }: Props) {
  const { highest_rated: best, biggest_disagreement: fight } = stats
  const people = usePeople()
  const [editingPeople, setEditingPeople] = useState(false)
  const critic = criticLine(stats, people)

  return (
    <section aria-label="Stats" className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatTile label="Movies watched">
        <span className={big}>{stats.total_watched}</span>
      </StatTile>

      <StatTile label="Hours watched">
        <span className={big}>
          {stats.total_hours}
          <span className="ml-1 text-lg text-muted">h</span>
        </span>
      </StatTile>

      <StatTile label="Top genre">{stats.top_genre ? <span className={title}>{stats.top_genre}</span> : none}</StatTile>

      <StatTile label="Highest rated" onClick={best ? () => onOpenMovie(best.id) : undefined}>
        {best && best.average_verdict !== null ? (
          <>
            <span className={title}>{best.title}</span>
            <span className="mt-1 text-sm text-muted">
              <span className="font-semibold text-accent">{formatStars(best.average_verdict)} ★</span> average
            </span>
          </>
        ) : (
          none
        )}
      </StatTile>

      <StatTile label={`${people[0].name} vs ${people[1].name}`} onClick={() => setEditingPeople(true)}>
        <span className="flex flex-col gap-1.5">
          {people.map((person) => {
            const given = stats.people[person.id]
            return (
              <span key={person.id} className="flex items-center gap-2">
                <PersonAvatar person={person.id} size="xs" />
                <span className={`font-semibold ${person.textClass}`}>
                  {given.average_verdict === null ? '—' : `${formatStars(given.average_verdict)} ★`}
                </span>
                <span className="text-xs text-faint">{given.rated_count} rated</span>
              </span>
            )
          })}
          {critic && <span className="text-xs text-muted">{critic}</span>}
        </span>
      </StatTile>

      <StatTile label="Biggest disagreement" onClick={fight ? () => onOpenMovie(fight.movie.id) : undefined}>
        {fight ? (
          <>
            <span className={title}>{fight.movie.title}</span>
            <span className="mt-1 flex items-center gap-2 text-sm">
              {people.map((person) => (
                <span key={person.id} className={`font-semibold ${person.textClass}`}>
                  {person.emoji} {person.id === 'fuf' ? fight.movie.fuf_verdict : fight.movie.cookie_verdict}★
                </span>
              ))}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted">None yet</span>
        )}
      </StatTile>
      <PeopleSettingsModal open={editingPeople} onClose={() => setEditingPeople(false)} />
    </section>
  )
}
