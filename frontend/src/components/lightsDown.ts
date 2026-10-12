// "Lights down": once a pick is confirmed, everything on the stage except the chosen movie dims, like a cinema
// before the film. Shared by the wheel stage (PickPage) and the podium.

/** Always on the dimmable part, so the change eases in (and back out if they pick something else). */
export const LIGHTS_DOWN_CLASS = 'transition-[opacity,filter] duration-1000 ease-out motion-reduce:transition-none'

/** Applied once confirmed. */
export const DIMMED_CLASS = 'opacity-40 saturate-[0.35]'
