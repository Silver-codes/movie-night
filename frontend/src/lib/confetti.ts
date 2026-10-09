const COLOR_TOKENS = ['--color-accent', '--color-accent-strong', '--color-fuf', '--color-cookie', '--color-fg']

function themeColors(): string[] {
  const style = getComputedStyle(document.documentElement)
  return COLOR_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean)
}

function loadConfetti() {
  return import('canvas-confetti')
}

/** Start downloading the confetti chunk (e.g. when a spin starts), so the burst isn't late. */
export function preloadConfetti(): void {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void loadConfetti()
  }
}

/**
 * A celebratory burst from both bottom corners in the theme's colors (skipped with reduced motion). It falls
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
