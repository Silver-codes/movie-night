import { SoundOffIcon, SoundOnIcon } from './NavIcons'

type Props = {
  on: boolean
  onToggle: () => void
  className?: string
}

/** The wheel's tick sound on/off (remembered by the Pick page). */
export function SoundToggle({ on, onToggle, className = 'size-12' }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label="Wheel sound"
      title={on ? 'Sound on' : 'Sound off'}
      className={`grid shrink-0 place-items-center rounded-xl text-muted ring-1 ring-ink-600 transition hover:text-fg ${className}`}
    >
      {on ? <SoundOnIcon className="size-5" /> : <SoundOffIcon className="size-5" />}
    </button>
  )
}
