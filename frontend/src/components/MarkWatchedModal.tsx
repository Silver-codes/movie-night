import { useState, type FormEvent } from 'react'
import { useMarkWatched } from '../api/movieHooks'
import type { Movie, MovieWatched, Person, Stars } from '../api/types'
import { movieNightDate } from '../lib/format'
import { toast } from '../lib/toast'
import { PEOPLE } from '../people'
import { Modal } from './Modal'
import { VerdictFields } from './VerdictFields'

type Props = {
  movie: Movie
  open: boolean
  onClose: () => void
  /** Called once the movie is saved as watched. */
  onDone: () => void
}

/** "Mark watched": the date (tonight by default), plus optional verdicts and notes for both. */
export function MarkWatchedModal({ movie, open, onClose, onDone }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={`Watched ${movie.title}`}>
      {/* Only mounted while open, so every opening starts with a fresh form. */}
      <MarkWatchedForm movie={movie} onCancel={onClose} onDone={onDone} />
    </Modal>
  )
}

const EMPTY_VERDICTS: Record<Person, Stars> = { fuf: null, cookie: null }
const EMPTY_NOTES: Record<Person, string> = { fuf: '', cookie: '' }

function MarkWatchedForm({ movie, onCancel, onDone }: { movie: Movie; onCancel: () => void; onDone: () => void }) {
  const watched = useMarkWatched()
  const [tonight] = useState(movieNightDate)
  const [date, setDate] = useState(tonight)
  const [verdicts, setVerdicts] = useState(EMPTY_VERDICTS)
  const [notes, setNotes] = useState(EMPTY_NOTES)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    // Only send what was filled in; without `watched_on` the server uses tonight's date.
    const body: MovieWatched = {}
    if (date && date !== tonight) {
      body.watched_on = date
    }
    for (const person of PEOPLE) {
      const verdict = verdicts[person.id]
      const note = notes[person.id].trim()
      if (verdict !== null) {
        body[`${person.id}_verdict` as const] = verdict
      }
      if (note) {
        body[`${person.id}_note` as const] = note
      }
    }
    watched.mutate(
      { id: movie.id, body },
      {
        onSuccess: () => {
          toast.success(`${movie.title} is in your history`)
          onDone()
        },
      },
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6"
    >
      <label className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">Watched on</span>
        <input
          type="date"
          value={date}
          max={tonight}
          required
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl bg-ink-800 px-3 py-2 text-fg ring-1 ring-ink-700 focus:ring-2 focus:ring-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {PEOPLE.map((person) => (
          <VerdictFields
            key={person.id}
            person={person.id}
            verdict={verdicts[person.id]}
            onVerdictChange={(value) => setVerdicts((prev) => ({ ...prev, [person.id]: value }))}
            note={notes[person.id]}
            onNoteChange={(value) => setNotes((prev) => ({ ...prev, [person.id]: value }))}
          />
        ))}
      </div>
      <p className="-mt-2 text-sm text-faint">
        Not sure yet? Leave it empty and rate it later from the movie's details.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-3 font-semibold text-muted ring-1 ring-ink-600 transition hover:bg-ink-800 hover:text-fg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={watched.isPending}
          className="flex-1 rounded-xl bg-accent px-4 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60"
        >
          {watched.isPending ? 'Saving…' : 'Save to history'}
        </button>
      </div>
    </form>
  )
}
