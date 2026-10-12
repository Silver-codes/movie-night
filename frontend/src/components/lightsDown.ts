// "Lights down": once a pick is confirmed, everything on the stage except the chosen movie dims, like a cinema
// before the film. Shared by the wheel stage (PickPage) and the podium.

/** Always on the dimmable part, so the change eases in (and back out if they pick something else). */
export const LIGHTS_DOWN_CLASS = 'transition-[opacity,filter] duration-1000 ease-out motion-reduce:transition-none'

/** Applied once confirmed. */
export const DIMMED_CLASS = 'opacity-40 saturate-[0.35]'

/** For dimmed controls they may still need (the back row): an usher's torch, up quickly while pointed at or focused. */
export const RAISE_ON_REACH_CLASS =
  'hover:opacity-100 hover:saturate-100 hover:duration-200 focus-within:opacity-100 focus-within:saturate-100 focus-within:duration-200'
