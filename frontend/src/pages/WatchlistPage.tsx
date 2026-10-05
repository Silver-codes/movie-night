import { EmptyState } from '../components/EmptyState'
import { WatchlistIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PersonTag } from '../components/PersonTag'
import { PosterGridSkeleton } from '../components/PosterGridSkeleton'
import { PEOPLE } from '../people'

export function WatchlistPage() {
  return (
    <>
      <PageHeader
        title="Watchlist"
        subtitle="Everything you've saved, with both of your hype stars."
        actions={PEOPLE.map((person) => (
          <PersonTag key={person.id} person={person.id} />
        ))}
      />
      <div className="flex flex-col gap-10">
        <EmptyState title="Your watchlist is coming soon" icon={<WatchlistIcon className="size-7" />}>
          Poster cards, filters and the detail drawer arrive in the next step.
        </EmptyState>
        <PosterGridSkeleton />
      </div>
    </>
  )
}
