import { useState } from 'react'
import { useUpdateMovie } from '../api/movieHooks'
import type { Movie, Person } from '../api/types'
import { movieNightDate } from '../lib/format'
import { PEOPLE } from '../people'
import { HypeVsReality } from './HypeVsReality'
import { PickMethodBadge } from './PickMethodBadge'
import { StarDisplay } from './StarDisplay'
import { VerdictFields } from './VerdictFields'

/** Drawer section for a watched movie: date, editable verdicts and notes, and the hype for comparison. */
export function WatchedDetails({ movie }: { movie: Movie }) {
  const update = useUpdateMovie()
  // Notes are edited locally and saved on blur; the parent keys this component by movie id.
  const [notes, setNotes] = useState<Record<Person, string>>({
    fuf: movie.fuf_note ?? '',
    cookie: movie.cookie_note ?? '',
  })

  function saveNote(person: Person) {
    const note = notes[person].trim()
    const saved = (person === 'fuf' ? movie.fuf_note : movie.cookie_note) ?? ''
    if (note !== saved) {
      update.mutate({ id: movie.id, update: { [`${person}_note`]: note || null } })
    }
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-sans text-sm font-semibold tracking-wide text-muted uppercase">Verdict</h3>
          <PickMethodBadge method={movie.confirmed_pick_method} />
        </div>
        <label className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-800 px-4 py-3 ring-1 ring-ink-700">
          <span className="font-medium">Watched on</span>
          <input
            type="date"
            value={movie.watched_on ?? ''}
            max={movieNightDate()}
            required
            onChange={(e) => {
              if (e.target.value) {
                update.mutate({ id: movie.id, update: { watched_on: e.target.value } })
              }
            }}
            className="rounded-lg bg-ink-900 px-2 py-1 text-fg ring-1 ring-ink-700 focus:ring-2 focus:ring-accent focus:outline-none"
          />
        </label>
        {PEOPLE.map((person) => (
          <VerdictFields
            key={person.id}
            person={person.id}
            verdict={person.id === 'fuf' ? movie.fuf_verdict : movie.cookie_verdict}
            onVerdictChange={(value) =>
              update.mutate({ id: movie.id, update: { [`${person.id}_verdict`]: value } })
            }
            note={notes[person.id]}
            onNoteChange={(value) => setNotes((prev) => ({ ...prev, [person.id]: value }))}
            onNoteBlur={() => saveNote(person.id)}
          />
        ))}
      </section>

      <section className="flex flex-col gap-2.5 rounded-2xl bg-ink-950/60 p-4 ring-1 ring-ink-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans text-sm font-semibold tracking-wide text-muted uppercase">Hype before</h3>
          <HypeVsReality movie={movie} />
        </div>
        {PEOPLE.map((person) => (
          <StarDisplay
            key={person.id}
            person={person.id}
            value={person.id === 'fuf' ? movie.fuf_hype : movie.cookie_hype}
          />
        ))}
      </section>
    </>
  )
}
