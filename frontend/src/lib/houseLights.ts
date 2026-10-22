import { useEffect } from 'react'

/** How long nobody touches anything before the room around tonight's movie goes dark. */
const IDLE_MS = 4000
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin'] as const

/**
 * The house lights, for a screen left up while they watch (tonight's card, a confirmed pick): while `active`,
 * `<html data-lights>` turns "down" after `IDLE_MS` without input and back "up" on any. The room (nav, tab bar,
 * captions) follows through the `lights-down:` variant (`HOUSE_LIGHTS_CLASS`); the movie itself never dims.
 */
export function useHouseLights(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return
    }
    const root = document.documentElement
    let timer = 0
    const set = (lights: 'up' | 'down') => {
      // pointermove fires constantly: only touch the attribute (and restyle) when it changes.
      if (root.dataset.lights !== lights) {
        root.dataset.lights = lights
      }
    }
    const wake = () => {
      set('up')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => set('down'), IDLE_MS)
    }
    wake()
    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, wake, { passive: true, capture: true })
    }
    return () => {
      window.clearTimeout(timer)
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, wake, { capture: true })
      }
      delete root.dataset.lights
    }
  }, [active])
}
