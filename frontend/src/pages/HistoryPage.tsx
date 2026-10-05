import { EmptyState } from '../components/EmptyState'
import { HistoryIcon } from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'

export function HistoryPage() {
  return (
    <>
      <PageHeader title="History" subtitle="Everything you've watched together, and how you rated it." />
      <EmptyState title="Your history is coming soon" icon={<HistoryIcon className="size-7" />}>
        The timeline and Fuf vs Cookie stats arrive in a later step.
      </EmptyState>
    </>
  )
}
