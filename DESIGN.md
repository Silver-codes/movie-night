---
name: Movie Night
description: A dark, quiet room for two where the movie artwork and the evening's pick take the screen.
colors:
  ink-950: "#0a0b0d"
  ink-900: "#111317"
  ink-800: "#1a1d22"
  ink-700: "#262a31"
  ink-600: "#353a43"
  fg: "#e8eaee"
  muted: "#9aa1ad"
  faint: "#626875"
  accent: "#5b9dff"
  accent-strong: "#82b4ff"
  accent-soft: "#5b9dff26"
  danger: "#e5675c"
  success: "#7cc48a"
  swatch-lavender: "#a99cf2"
  swatch-rose: "#f08fb0"
  swatch-mint: "#7dd3ae"
  swatch-amber: "#f0c25e"
  swatch-coral: "#f59a76"
  swatch-sky: "#7cc7ec"
typography:
  display:
    fontFamily: "Outfit Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Outfit Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.375
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.025em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.ink-950}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
    padding: "14px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.ink-800}"
  chip:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  chip-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  input-search:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.fg}"
    rounded: "{rounded.2xl}"
    height: "56px"
  card-tile:
    backgroundColor: "{colors.ink-900}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  sheet:
    backgroundColor: "{colors.ink-900}"
    rounded: "{rounded.3xl}"
  nav-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
  nav-item-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  badge-rating:
    backgroundColor: "{colors.ink-950}"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Movie Night

## Overview

**Creative North Star: "Lights Down, Screen Up"**

The room goes dark so the screen can speak. Movie Night is a near-black, quiet interface whose surfaces step back on purpose: the color on any screen comes from TMDB posters and backdrops, from the two people's own colors, and from one cool blue that marks what to do next. Nothing decorative competes with the artwork or with the decision being made.

Depth is a faint silver glow falling from the top of the page, like light from a screen onto a dark room, and surfaces that stack in slightly lighter shades of ink. Components are soft and tactile: generously rounded, sitting on the dark like objects on velvet, answering touch with a small spring or press-in. Delight is saved for the pick itself (podium reveal, spinning wheel with ticks, confetti), so the rest of the app stays calm.

The interface is used side by side on a laptop or TV, and on a phone as a second way in. Layouts are designed to work at both sizes: sheets come from the bottom on phones and from the side or center on larger screens.

**Key Characteristics:**
- Near-black, cool-neutral ink surfaces layered by lightness, not by borders or heavy shadows.
- One accent (Screen Glow Blue) for the current action, selection and the winner; never decorative.
- Two person colors, chosen by the people themselves from six swatches, carry everything personal (stars, avatars, verdicts).
- Outfit for headings, Inter for everything else; tight-tracked semibold headings.
- Rounded, springy, tactile components; motion is reserved and respects reduced motion.

## Colors

A cool, desaturated night palette with exactly one blue light source and two personal colors.

### Primary
- **Screen Glow Blue** (accent): the TV's glow in a dark room. Primary buttons, the selected nav item, active non-default chips, the chosen pick method's outline, the wheel's winning slice and hub ring (once landed), the winner's poster outline on the podium, focus outlines and text selection. **Screen Glow Bright** (accent-strong) is its hover state. **Screen Glow Haze** (accent-soft, 15% alpha) tints selected backgrounds, icon tiles and badges.

### Secondary
- **The two people's colors** (`--color-fuf`, `--color-cookie`): pointed at one of six swatches each, chosen by the people in the app: **Lavender** (swatch-lavender, Fuf's default), **Rose** (swatch-rose, Cookie's default), **Mint** (swatch-mint), **Amber** (swatch-amber), **Coral** (swatch-coral), **Sky** (swatch-sky). Used for each person's stars, avatar ring and soft avatar fill (`*-soft`, a 15% `color-mix`), name tags and verdicts. All six are mid-light and readable on ink, and kept away from the accent hue.

### Tertiary
- **Ember Red** (danger): errors, error-state icon tiles, destructive confirmation.
- **Fresh Mint Green** (success): success toasts.

### Neutral
- **Theater Black** (ink-950): the page background, overlays on posters (rating badges, hub of the wheel), the dark text on blue buttons.
- **Velvet** (ink-900): raised surfaces: drawers, modals, stat tiles, method cards, search field, inactive chips.
- **Seat Gray** (ink-800): one step up: hover fills, poster placeholders, inner panels, genre pills.
- **Aisle Line** (ink-700): hairline rings and borders around surfaces; nav bar borders at 60%.
- **Dim House Light** (ink-600): stronger rings on hover, secondary button outlines, wheel rim.
- **Screen White** (fg): primary text.
- **Credits Gray** (muted): secondary text, inactive nav and chips.
- **Exit-Sign Dim** (faint): placeholders and the least important text.

### Named Rules
**The One Light Source Rule.** Screen Glow Blue is the only accent. It marks the current action, the current selection, or the winner, and nothing else. If two things on a screen are blue, one of them is wrong.

**The Names Are Theirs Rule.** Person colors only ever come from the `fuf` / `cookie` tokens (via `usePersonInfo()`), never from a swatch or hex directly, because the people can change them at any time.

**The Artwork Is the Color Rule.** Surfaces stay neutral ink so posters and backdrops are the most colorful thing on screen. Don't tint surfaces to make a page "feel" like something.

## Typography

**Display Font:** Outfit Variable (with Inter Variable, system sans)
**Body Font:** Inter Variable (with system sans)

**Character:** Outfit's round, geometric headings give the app its friendly marquee voice; Inter keeps titles, ratings and controls crisp at small sizes. Both are self-hosted variable fonts.

### Hierarchy
- **Display** (600, 48px on md+ / 36px on phones, line-height 1, -0.025em): page titles in `PageHeader` (Watchlist, Pick, History, Search).
- **Headline** (600, 36px on sm+ / 30px, 1.25, -0.025em): the winner's title on the Pick page, and other big reveal moments.
- **Title** (600, 20px, 1.4): pick method names, modal titles, empty-state headings (24px), drawer section headings. All `h1`–`h3` use Outfit.
- **Body** (400, 16px, 1.5): descriptions and running text; `max-w-prose` (65ch) for supporting copy under page titles.
- **Body Small** (500–600, 14px, 1.375): movie titles on cards (Inter, semibold, clamped to 2 lines), chips, metadata.
- **Label** (600, 12px, 0.025em, uppercase): stat tile labels, the "winner" tag, small badges.

### Named Rules
**The Display for Moments Rule.** Outfit is for headings and named moments (page titles, method names, the winner). Movie titles inside grids and lists are Inter, so a wall of posters reads as content, not as a stack of headings.

## Layout

Content sits in a centered container (max 72rem / `max-w-6xl`) with 16px side gutters on phones and 24px from `sm`. On `md`+ a sticky top nav (64px, translucent ink with blur) holds the logo, page links and the people button; below `md` a fixed bottom tab bar with four tabs replaces it, padded for the safe areas.

Poster grids share one column set: 2 columns on phones, 3 at `sm`, 4 at `md`, 6 at `lg`, with 16px horizontal and 24px vertical gaps. Page headers sit 32px above the content, with title and actions stacked on phones and side by side, bottom-aligned, from `sm`. Rows of chips scroll sideways on phones with faded edges instead of wrapping.

The spacing rhythm follows Tailwind's 4px scale; groups are typically 8–12px apart inside a component and 20–32px between sections. Breakpoints are Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024).

**The Same Room, Two Screens Rule.** Every screen must work on a laptop or TV for two people sitting back and on a 375px phone. Overlays switch shape (bottom sheet ↔ side panel or centered dialog), not content.

**Stage mode (Pick page).** Once a pick is on screen, the page header shrinks to a back row and the method name, and from `lg` the moment is sized for the couch: the wheel stage breaks out of the column (up to 100rem), the wheel is as tall as the window allows (`max(28rem, 100dvh − 15rem)`), and secondary text is at least 18px, with each person's name and large stars on the winner. The whole wheel, the winner and its actions must fit a 1440×900 screen without scrolling.

## Elevation & Depth

Depth comes mostly from tonal layering: each raised surface is one step lighter in ink and outlined by a 1px Aisle Line ring. Shadows are dark and diffuse (pure black at 30–60%), used for physical things that float over the page: posters, the search field, sheets, toasts. There are no colored shadows or glows: blue is a fill or an outline, never light spilling around an element. Overlays dim the page with black at 60–70% plus a slight backdrop blur.

### Shadow Vocabulary
- **Poster lift** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4)`, growing to `0 20px 25px -5px rgb(0 0 0 / 0.6)` on hover): poster cards on dark ground.
- **Floating sheet** (`box-shadow: 0 25px 50px -12px rgb(0 0 0)`): drawer and modal panels.
- **Toast** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5)`): toasts above everything.
- **Room glow** (`radial-gradient(ellipse 80% 50% at 50% -10%, #c9d1dd17, transparent 70%)` on a fixed `body::before`): the faint screen light at the top of every page.

### Named Rules
**The Velvet, Not Glass Rule.** Surfaces are solid ink. Blur is only for chrome that floats over moving content (nav bars, overlay backdrops, the drawer's close button, badges on posters), never for cards.

## Shapes

Generously rounded and soft everywhere: posters and small cards use 12px corners, tiles, method cards, the search field and empty states 16px, sheets and the winner card 24px (top corners only for bottom sheets on phones). Chips, badges, avatars, nav pills and the close button are full pills or circles. Borders are 1px rings in ink tones, not strokes in color; dashed outlines are reserved for empty states. The wheel is the one large circular form, with thin dark dividers between slices.

## Components

### Buttons
Soft, confident and quick to press.
- **Shape:** gently rounded (12px).
- **Primary:** Screen Glow Blue fill, Theater Black text, semibold, 10px × 20px (the main pick confirmation grows to 14px × 20px and 18px text).
- **Hover / Focus:** fill brightens to Screen Glow Bright; focus is a 2px blue outline offset by 2px (global `:focus-visible`). Disabled drops to 50–60% opacity.
- **Secondary:** transparent with a Dim House Light ring; hover fills with Seat Gray.
- **Text action:** muted text that turns Screen White and underlines on hover ("Not tonight" on the winner screen).
- **Icon buttons:** circular, ringed, with large tap targets (at least 40px).

### Chips
- **Style:** pill, 14px medium text, Velvet fill, Credits Gray text, Aisle Line ring.
- **State:** active becomes Screen Glow Haze fill, blue text and blue ring (person filters use the person's soft tint and color instead). A default choice ("Any length", "Any genre") that's selected stays neutral (Dim House Light fill, Screen White text), so blue only marks a filter that's actually on. Hover brightens text and ring.

### Cards / Containers
- **Poster cards:** the poster itself is the card (2:3, 12px corners, faint white ring, poster lift shadow), with the title and both people's stars below. The whole card is one button (the title stretched over the card); it presses in to 98%. Skipped-tonight movies go grayscale at 50% opacity with a label.
- **Tiles and method cards:** Velvet at 80%, 16px corners, Aisle Line ring, 16–20px padding; clickable ones lift to Seat Gray on hover.
- **Shadow Strategy:** see Elevation & Depth; tiles stay flat.

### Inputs / Fields
- **Search:** tall (56px, 64px on md+), 16px corners, Velvet with a 1px Aisle Line border, large text (18–20px), a search icon on the left, a soft dark shadow. Focus turns the border Screen Glow Blue (no outline ring).
- **Star rating:** a row of five stars in the person's color; hover scales a star up, tapping the current star clears it (previewed with a ×). Sizes xs / sm / md.

### Navigation
- **Top nav (md+):** sticky, translucent Theater Black with blur and a hairline bottom border; links are pills with icon + label, Credits Gray, hover Seat Gray, active Screen Glow Haze with blue text.
- **Bottom tab bar (phones):** fixed, four equal tabs with icon over label; the active tab gets a blue pill behind its icon.

### Drawer and Modal
Sheets that slide in on a spring. The drawer is a bottom sheet (24px top corners, 92% height) on phones and a 30rem right panel on md+, opening on a backdrop image that fades into Velvet. The modal is a bottom sheet on phones and a centered 42rem dialog with 24px corners on md+, with a sticky blurred header. Both trap focus and close on Escape.

### Spin Wheel (signature)
An SVG wheel in shades of ink with thin Theater Black dividers; slices are sized by probability. It spins for ~5.8s on a custom ease with synthesized ticks and lands inside the winner's slice, which then fills Screen Glow Blue while the hub ring turns blue with it. Until then nothing on the wheel is blue: the rim bulbs are white at 70% / 30%, the pointer is white with a dark dot. With reduced motion it only glides (0.8s, ease-out).

### Top-Rated Podium (signature)
The top three on hype, revealed on springs: #1 springs in last and bouncier, with ties tagged. The podium is where Top Rated is decided: #1's title, details and the pick actions sit beside it on laptops/TVs (below it on phones), the same pairing as the wheel and its winner card, and confetti falls as #1 lands.

### Toasts
Ink-800 cards at 95% with blur, 12px corners and a status icon, at the top on phones and bottom-right on md+.

## Do's and Don'ts

### Do:
- **Do** take every surface color from the ink tokens (`ink-950` → `ink-600`) and layer by lightness.
- **Do** keep Screen Glow Blue for the current action, selection, focus and the winner only.
- **Do** color everything personal through the `fuf` / `cookie` tokens and `usePersonInfo()`, never through swatches or hex values.
- **Do** use Outfit (`font-display`) for page titles, method names, modal titles and the winner; Inter for movie titles in grids and for controls.
- **Do** round generously (12px posters and buttons, 16px tiles, 24px sheets, pills for chips and badges) and use 1px ink rings instead of colored borders.
- **Do** use spring transitions for things that enter or move, CSS `active:scale-*` for press feedback on non-buttons, and a reduced-motion fallback for every big motion.
- **Do** design each screen for a shared laptop/TV first and check it at 375px.

### Don't:
- **Don't** add a second accent color or use blue for decoration.
- **Don't** hardcode a person's name, emoji or color in the UI.
- **Don't** tint page surfaces or add colored gradients; the posters provide the color.
- **Don't** put `backdrop-blur` on cards; keep blur for floating chrome and overlays.
- **Don't** put colored glows or colored shadows around anything; blue is a fill or an outline.
- **Don't** use Motion's `whileTap` on non-button elements (it adds `tabindex=0`).
