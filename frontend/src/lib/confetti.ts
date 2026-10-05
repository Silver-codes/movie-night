const COLOR_TOKENS = ['--color-accent', '--color-accent-strong', '--color-fuf', '--color-cookie', '--color-fg']

function themeColors(): string[] {
  const style = getComputedStyle(document.documentElement)
  return COLOR_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean)
}

/** A celebratory burst from both bottom corners in the theme's colors (skipped with reduced motion). */
export function fireConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  const colors = themeColors()
  const shared = { particleCount: 90, spread: 70, startVelocity: 55, ticks: 220, colors, zIndex: 60 }
  // Loaded on the first celebration only; it isn't needed anywhere else.
  void import('canvas-confetti').then(({ default: confetti }) => {
    void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.9 } })
    void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.9 } })
  })
}
