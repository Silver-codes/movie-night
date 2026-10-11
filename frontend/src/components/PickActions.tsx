import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { CheckIcon } from './NavIcons'

type Props = {
  movieId: number
  confirmed: boolean
  confirming: boolean
  onConfirm: () => void
  /** The secondary button next to "We're watching this!" ("Spin again", "Flip again"); omitted when there's none. */
  againLabel?: string
  onAgain?: () => void
  /** After confirming: "Pick something else". */
  onPickSomethingElse: () => void
  /** Puts the winner on "not tonight" and picks again. */
  onNotTonight: () => void
  /** Set for the moment between "Not tonight" and the new pick: the link becomes an Undo. */
  onUndoNotTonight?: () => void
  busy: boolean
}

/** What to do with tonight's pick: confirm it, try again, or leave it out. Shared by the wheel's winner and the podium. */
export function PickActions({
  movieId,
  confirmed,
  confirming,
  onConfirm,
  againLabel,
  onAgain,
  onPickSomethingElse,
  onNotTonight,
  onUndoNotTonight,
  busy,
}: Props) {
  if (confirmed) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-ink-800 p-4 ring-1 ring-ink-700">
        <p className="flex items-center gap-2 font-semibold lg:text-xl">
          <CheckIcon className="size-5 text-success" />
          Enjoy the movie! 🍿
        </p>
        <p className="text-sm text-fg/85 lg:text-lg">When it's over, rate it from the watchlist so it lands in your history.</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/watchlist?movie=${movieId}`}
            className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-ink-950 transition hover:bg-accent-strong lg:px-5 lg:py-3 lg:text-lg"
          >
            Rate it after watching
          </Link>
          <button
            type="button"
            onClick={onPickSomethingElse}
            className="rounded-xl px-4 py-2.5 font-semibold text-muted ring-1 ring-ink-600 transition hover:text-fg lg:px-5 lg:py-3 lg:text-lg"
          >
            Pick something else
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-xl bg-accent px-5 py-3.5 text-lg font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-60 lg:py-4 lg:text-2xl"
        >
          {confirming ? 'Saving…' : "We're watching this!"}
        </button>
        {againLabel && onAgain && (
          <button
            type="button"
            onClick={onAgain}
            disabled={busy}
            className="rounded-xl px-5 py-3.5 font-semibold ring-1 ring-ink-600 transition hover:bg-ink-800 disabled:opacity-60 lg:px-7 lg:py-4 lg:text-xl"
          >
            {againLabel}
          </button>
        )}
      </div>
      {onUndoNotTonight ? (
        <UndoNotTonight onUndo={onUndoNotTonight} />
      ) : (
        <button
          type="button"
          onClick={onNotTonight}
          disabled={busy}
          // A full-height tap target, set a little apart from "Spin again" so a thumb doesn't slip onto it.
          className="mt-1 self-center rounded-lg px-3 py-3 text-sm text-muted underline-offset-4 transition hover:text-fg hover:underline disabled:opacity-60 sm:mt-0 sm:py-1 lg:text-lg"
        >
          Not tonight. Leave it out and pick again
        </button>
      )}
    </div>
  )
}

/** Takes the place of the "Not tonight" link (and its focus) until the next pick starts. */
function UndoNotTonight({ onUndo }: { onUndo: () => void }) {
  const undo = useRef<HTMLButtonElement>(null)
  // The link that had focus is gone; keep the keyboard where it was.
  useEffect(() => {
    undo.current?.focus({ preventScroll: true })
  }, [])
  return (
    <p className="flex items-center justify-center gap-3 self-center text-sm text-muted lg:text-lg">
      Out for tonight. Picking again…
      <button
        ref={undo}
        type="button"
        onClick={onUndo}
        className="-my-1.5 rounded-lg px-3 py-1.5 font-semibold text-fg ring-1 ring-ink-600 transition hover:bg-ink-800"
      >
        Undo
      </button>
    </p>
  )
}
