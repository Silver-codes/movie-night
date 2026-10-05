import type { KeyboardEvent } from 'react'

// Keyboard focus helpers shared by `Drawer` and `Modal`.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * `onKeyDown` for a dialog: Tab / Shift+Tab wrap around inside it instead of leaving for the page behind.
 * The innermost dialog owns Tab: a Modal inside a Drawer stops it from reaching the Drawer.
 */
export function trapTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') {
    return
  }
  event.stopPropagation()
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  )
  const first = focusable.at(0)
  const last = focusable.at(-1)
  if (!first || !last) {
    event.preventDefault()
    return
  }
  const active = document.activeElement
  // From the dialog itself (focused on open) or from outside, Shift+Tab goes to the last control.
  const onDialog = active === event.currentTarget || !event.currentTarget.contains(active)
  if (event.shiftKey && (active === first || onDialog)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Give focus back to what opened a dialog. If that element is gone (the dialog removed it,
 * e.g. "Mark watched" takes the card off the watchlist), focus the page's heading instead.
 */
export function restoreFocus(previous: HTMLElement | null) {
  if (previous?.isConnected) {
    previous.focus()
  } else {
    focusPageHeading()
  }
  // The opener can also disappear a moment later, when the list refetches; focus then falls to <body>.
  window.setTimeout(() => {
    if (document.activeElement === document.body) {
      focusPageHeading()
    }
  }, 800)
}

function focusPageHeading() {
  const heading = document.querySelector<HTMLElement>('main h1')
  if (heading) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
}
