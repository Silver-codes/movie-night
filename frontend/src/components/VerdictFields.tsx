import { useId } from 'react'
import type { Person, Stars } from '../api/types'
import { usePersonInfo } from '../people'
import { StarRating } from './StarRating'

const NOTE_MAX_LENGTH = 280

type Props = {
  person: Person
  verdict: Stars
  onVerdictChange: (value: Stars) => void
  note: string
  onNoteChange: (value: string) => void
  /** e.g. save the note when the field loses focus. */
  onNoteBlur?: () => void
}

/** One person's verdict stars and short note. */
export function VerdictFields({ person, verdict, onVerdictChange, note, onNoteChange, onNoteBlur }: Props) {
  const info = usePersonInfo(person)
  const noteId = useId()
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-ink-950/60 p-4 ring-1 ring-ink-700">
      <StarRating
        person={person}
        value={verdict}
        onChange={onVerdictChange}
        size="sm"
        showName
        label={`${info.name}'s verdict`}
      />
      <label htmlFor={noteId} className="sr-only">
        {`${info.name}'s note`}
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        onBlur={onNoteBlur}
        maxLength={NOTE_MAX_LENGTH}
        rows={2}
        placeholder={`${info.name}'s note (optional)`}
        className="w-full resize-none rounded-xl bg-ink-800 px-3 py-2 text-sm text-fg ring-1 ring-ink-700 transition placeholder:text-faint focus:ring-2 focus:ring-accent focus:outline-none"
      />
    </div>
  )
}
