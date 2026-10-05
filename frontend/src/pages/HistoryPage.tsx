import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useHistory } from '../api/historyHooks'
import type { HistoryEntry } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { HistoryEntryCard } from '../components/HistoryEntryCard'
import { HistoryStats } from '../components/HistoryStats'
import { MovieDrawer } from '../components/MovieDrawer'
import { HistoryIcon, PickIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { Skeleton } from '../components/Skeleton'
import { formatMonth } from '../lib/format'
import { useMovieParam } from '../lib/useMovieParam'

const buttonClass =
  'inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink-950 transition hover:bg-accent-strong'

type MonthGroup = { month: string; entries: HistoryEntry[] }

/** Consecutive entries (already newest first) grouped by the month they were watched in. */
function groupByMonth(entries: HistoryEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const entry of entries) {
    const month = entry.watched_on ? formatMonth(entry.watched_on) : 'Unknown date'
    const last = groups.at(-1)
    if (last?.month === month) {
      last.entries.push(entry)
    } else {
      groups.push({ month, entries: [entry] })
    }
  }
  return groups
}

function HistorySkeleton() {
  return (
    <div aria-label="Loading history" className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export function HistoryPage() {
  const history = useHistory()
  const { openId, openMovie, closeMovie } = useMovieParam()
  const placeholder = history.data?.movies.find((m) => m.id === openId)

  let content: ReactNode
  if (history.isPending) {
    content = <HistorySkeleton />
  } else if (history.isError) {
    content = (
      <EmptyState
        title="Couldn't load your history"
        action={
          <button type="button" className={buttonClass} onClick={() => void history.refetch()}>
            Try again
          </button>
        }
      >
        {history.error.message}
      </EmptyState>
    )
  } else if (history.data.movies.length === 0) {
    content = (
      <EmptyState
        title="Nothing watched yet"
        icon={<HistoryIcon className="size-7" />}
        action={
          <Link to="/pick" className={buttonClass}>
            <PickIcon className="size-5" />
            Pick tonight's movie
          </Link>
        }
      >
        Once you mark a movie as watched, it shows up here with both of your verdicts.
      </EmptyState>
    )
  } else {
    content = (
      <>
        <HistoryStats stats={history.data.stats} onOpenMovie={openMovie} />
        <div className="flex flex-col gap-8">
          {groupByMonth(history.data.movies).map((group) => (
            <section key={group.month} aria-label={group.month}>
              <h2 className="mb-4 text-xl font-semibold text-muted">{group.month}</h2>
              {/* The timeline: a line on the left with a dot per movie. */}
              <ol className="relative flex flex-col gap-4 border-l border-ink-700 pl-5 sm:pl-7">
                {group.entries.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute top-6 -left-[calc(1.25rem+5px)] size-2.5 rounded-full bg-accent ring-4 ring-ink-950 sm:-left-[calc(1.75rem+5px)]"
                    />
                    <HistoryEntryCard entry={entry} onOpen={openMovie} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </>
    )
  }

  const count = history.data?.movies.length

  return (
    <>
      <PageHeader
        title="History"
        subtitle={
          count
            ? `${count} ${count === 1 ? 'movie' : 'movies'} watched together. Tap one to change your verdicts.`
            : "Everything you've watched together, and how you rated it."
        }
      />
      {content}

      <MovieDrawer movieId={openId} placeholder={placeholder} onClose={closeMovie} />
    </>
  )
}
