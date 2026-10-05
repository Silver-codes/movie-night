import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { posterUrl } from '../api/images'
import type { HistoryEntry } from '../api/types'
import { formatDate, formatStars } from '../lib/format'
import { PEOPLE } from '../people'
import { HypeVsReality } from './HypeVsReality'
import { PersonAvatar } from './PersonAvatar'
import { PickMethodBadge } from './PickMethodBadge'
import { PosterImage } from './PosterImage'
import { StarDisplay } from './StarDisplay'

type Props = {
  entry: HistoryEntry
  onOpen: (id: number) => void
}

/** One watched movie on the History timeline; the poster and title open the drawer. */
export function HistoryEntryCard({ entry, onOpen }: Props) {
  const [showNotes, setShowNotes] = useState(false)
  const notesId = useId()
  const notes = PEOPLE.flatMap((person) => {
    const note = person.id === 'fuf' ? entry.fuf_note : entry.cookie_note
    return note ? [{ person, note }] : []
  })

  return (
    <article className="flex gap-4 rounded-2xl bg-ink-900/80 p-3 ring-1 ring-ink-700 sm:p-4">
      <button
        type="button"
        onClick={() => onOpen(entry.id)}
        // The title button below does the same for keyboards and screen readers.
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0 self-start rounded-xl"
      >
        <PosterImage src={posterUrl(entry.poster_path, 'w185')} title={entry.title} decorative className="w-16 sm:w-20" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          {entry.watched_on && (
            <time dateTime={entry.watched_on} className="text-xs text-muted">
              {formatDate(entry.watched_on)}
            </time>
          )}
          <h3 className="font-sans leading-snug font-semibold">
            <button type="button" onClick={() => onOpen(entry.id)} className="text-left hover:text-accent-strong">
              {entry.title}
              {entry.year && <span className="font-normal text-muted"> ({entry.year})</span>}
            </button>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <PickMethodBadge method={entry.confirmed_pick_method} />
          <HypeVsReality movie={entry} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-1">
            {PEOPLE.map((person) => (
              <StarDisplay
                key={person.id}
                person={person.id}
                value={person.id === 'fuf' ? entry.fuf_verdict : entry.cookie_verdict}
              />
            ))}
          </div>
          {entry.average_verdict !== null && (
            <span className="text-sm text-muted">
              Avg <span className="text-lg font-bold text-fg">{formatStars(entry.average_verdict)}</span>
              <span aria-hidden="true" className="ml-0.5 text-accent">
                ★
              </span>
            </span>
          )}
        </div>

        {notes.length > 0 && (
          <div>
            <button
              type="button"
              aria-expanded={showNotes}
              aria-controls={showNotes ? notesId : undefined}
              onClick={() => setShowNotes((open) => !open)}
              className="text-sm font-semibold text-accent hover:text-accent-strong"
            >
              {showNotes ? 'Hide notes' : `Show ${notes.length === 1 ? 'note' : 'notes'}`}
              <span aria-hidden="true" className={`ml-1 inline-block transition-transform ${showNotes ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            <AnimatePresence initial={false}>
              {showNotes && (
                <motion.ul
                  id={notesId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {notes.map(({ person, note }) => (
                    <li key={person.id} className="mt-2 flex gap-2 text-sm">
                      <PersonAvatar person={person.id} size="xs" decorative />
                      <p className="min-w-0 break-words">
                        <span className={`font-semibold ${person.textClass}`}>{person.name}: </span>
                        <span className="text-fg/85">{note}</span>
                      </p>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </article>
  )
}
