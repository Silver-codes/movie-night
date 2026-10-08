import { usePeople } from '../people'
import { Modal } from './Modal'
import { PersonProfileEditor } from './PersonProfileEditor'

type Props = {
  open: boolean
  onClose: () => void
}

/** "Who's watching?": both people's name, emoji and color, side by side from md up. */
export function PeopleSettingsModal({ open, onClose }: Props) {
  const [a, b] = usePeople()
  return (
    <Modal open={open} onClose={onClose} title="Who's watching?">
      <div className="px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
        <p className="mb-4 text-sm text-muted">Changes save as you go and show up on every device.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <PersonProfileEditor person={a} other={b} />
          <PersonProfileEditor person={b} other={a} />
        </div>
      </div>
    </Modal>
  )
}
