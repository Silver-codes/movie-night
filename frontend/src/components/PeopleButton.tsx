import { useState } from 'react'
import { GearIcon } from './NavIcons'
import { PeopleSettingsModal } from './PeopleSettingsModal'

/** Gear button in the header; opens the name / emoji / color settings. */
export function PeopleButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change names"
        title="Change names"
        className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-ink-800 hover:text-fg active:scale-95"
      >
        <GearIcon className="size-5" />
      </button>
      <PeopleSettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
