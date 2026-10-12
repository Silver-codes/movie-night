// The couple's own colors and screen white: the blue stays the winner's (One Light Source), and the
// celebration belongs to the two of them. Each person's color is listed twice so the white doesn't wash it out.
const COLOR_TOKENS = ['--color-fuf', '--color-fuf', '--color-cookie', '--color-cookie', '--color-fg']

function themeColors(): string[] {
  const style = getComputedStyle(document.documentElement)
  return COLOR_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean)
}

let loaded: ReturnType<typeof importConfetti> | null = null

function importConfetti() {
  return import('canvas-confetti')
}

function loadConfetti() {
  loaded ??= importConfetti()
  return loaded
}

/** Start downloading the confetti chunk (e.g. when a spin starts), so the burst isn't late. */
export function preloadConfetti(): void {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void loadConfetti()
  }
}

/**
 * A celebratory burst from both bottom corners in the two people's colors (skipped with reduced motion). It falls
 * behind the page (above the room glow, `body::before`): the solid winner card and wheel hide it, so it
 * fills the room around them and never covers the winner's title or buttons.
 */
export function fireConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  const colors = themeColors()
  const shared = { particleCount: 90, spread: 70, startVelocity: 55, ticks: 220, colors, zIndex: -1 }
  // Loaded on first use (or by preloadConfetti); it isn't needed anywhere else.
  void loadConfetti().then(({ default: confetti }) => {
    void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.9 } })
    void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.9 } })
  })
}

/** Clears confetti still falling (back to choosing, or off the page): the celebration belongs to that pick. */
export function stopConfetti(): void {
  // Nothing to clear (and nothing to download) if it never ran.
  void loaded?.then(({ default: confetti }) => confetti.reset())
}
