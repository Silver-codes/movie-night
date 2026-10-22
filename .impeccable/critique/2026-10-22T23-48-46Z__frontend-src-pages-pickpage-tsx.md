---
target: pick
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:00703aa767b9e8cce85dbc02f272e902e91b4216ad76f50946161a1bcb3c2dc6"
target_path: "D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-22T23-48-46Z
slug: frontend-src-pages-pickpage-tsx
---
Method: dual-agent (A: design review in its own browser + DB copy :5181/:8011 · B: detector + browser overlays :5182/:8012)

# Critique #8: Pick page (vs #7)

## Design Health Score
| # | Heuristic | #8 | #7 | Key issue |
|---|---|---|---|---|
| 1 | Visibility of System Status | 4 | 4 | Decision time/method, live hat count, 1st/2nd feature tags. Gap: the hero card in a double feature isn't tagged |
| 2 | Match System / Real World | 3 | 3 | "Tap the wheel to skip / spin again" with a mouse at 1440; "Lights down. Enjoy the movie!" hours later; "back tomorrow" at 01:40 (rollover is 06:00) |
| 3 | User Control and Freedom | 4 | 3 | Back to tonight, Undo on every cancel, inline Not-tonight Undo, focus back to the card title |
| 4 | Consistency and Standards | 3 | 3 | Same action, two names: "Take it back" (reminder) vs "Pick something else" (tonight's card) |
| 5 | Error Prevention | 3 | 2 | Confirm misfire fixed (mouse double-click, touch double-tap, double Enter verified). New: double-feature "Pick something else" swaps the other movie in at the same coordinates |
| 6 | Recognition Rather Than Recall | 3 | 3 | Hero = newest pick (2nd feature); the movie they watch first is a dimmable "Also tonight" link; reminders list 2nd above 1st |
| 7 | Flexibility and Efficiency | 3 | 3 | Space skips (838 ms to landed); still 21 Tab stops to Spin; one-movie hat spins 6 s |
| 8 | Aesthetic and Minimalist Design | 3 | 3 | Tonight page centred and calm, but idle the brightest things are buttons + a UI headline, not the movie |
| 9 | Error Recovery | 4 | 2 | pick/restore Undo from stage, tonight's card and reminders. Gap: focus lost after a double-feature cancel |
| 10 | Help and Documentation | 3 | 3 | Taglines, odds legend, tie note, "Coming up after X."; nothing explains the dimming nav |
| **Total** | | **33/40** | **29** | **Good (+4)** |

## Design Specificity Verdict
LLM: mostly authored for the couple (stage, house lights, centred lit tonight card, "Second feature / Coming up after X"). Interchangeable: the choose stage (reserved for shape) and the "Everything is out for tonight" empty state. The lighting metaphor is half-applied: the card's actions and "Lights down" headline stay lit while the room dims.
Deterministic: CLI `detect --json` over PickPage + 12 Pick components: exit 0, 0 findings. Browser detect.js injected in 14 states (7 × 1440/375): no anti-patterns, 0 console/page errors, 0 horizontal overflow. One unreproducible mobile "1 anti-pattern found" on the landed wheel (not seen in 13 reruns; rule/element not captured): unverified, likely mid-scroll timing. Vertical overflow 1440/375: choose 0/0, landed 0/258–469, confirmed 0/403, tonight 37/16, double 37/36, second feature 2/109, podium 0/344.
Overlays: injected only in the assessment's headless browser; no [Human] tab overlay.

## Overall Impression
Biggest jump in the series (29 → 33): P1 gone, Undo everywhere, tonight page is a screen. What's left is about the screen left up all evening: the wrong layer stays lit at idle, and a double feature spotlights the newest pick instead of the programme.

## What's Working
1. Misfire fixed: mouse double-click at CTA centre (1440), touch double-tap (375), double Enter: pick stays confirmed, on /pick, no toasts.
2. Undo coverage with focus: Pick something else → Undo restores; Not tonight keeps card height + focus on Undo → h2; Back to tonight focuses the card title; both directions scrollTo(0).
3. Tonight page fits: overflow 157/132/128 → 37/12/40 px; phone actions end at y 660 above the tab bar.

## Priority Issues
- [P2] Double feature spotlights the wrong movie and cancel swaps it under the pointer. Dune (1st) is "Also tonight" (dims at idle, links away); Goblet (2nd, untagged) is the hero. "Pick something else" (y 741–785) cancels Goblet; Dune's card renders with its own "Pick something else" at the same y; focus → body. Fix: programme view (1st feature as hero or 2-up, tagged); after a cancel focus the remaining title, ~700 ms inert, toast "X is out. Y is still tonight's pick."; one name for taking back tonight's movie. Command: clarify, then harden.
- [P2] House lights dim the wrong layer at idle: nav, h1 + subtitle (~2.3:1), Also-tonight row dim to 40%; the card's "Lights down…" headline, names line and both actions stay 100%. Fix: on the tonight page dim the news block + actions at idle, keep backdrop/poster/title/meta lit, keep the h1 lit (or make it the marquee label); replace "Lights down…" on reload with a time-neutral line ("Now showing" + "It's decided, 🐻 & 🍪"). Command: quieter (+ delight).
- [P2] Copy for the wrong device/time (unchanged since #7): "Tap the wheel to skip/spin again" at 1440 with a mouse; "They come back on their own tomorrow" at 01:40; "Lights down" all evening. Fix: "Click or press Space to skip" on fine pointers; "They're back next movie night". Command: clarify.
- [P3] Phone landings: after confirm scrollY 393 with a wheel-rim sliver + orphan sound button (y 103–139); after stage cancel scrollY 81 with the h1 under the toast. Fix: scroll the card to top after confirm; scrollTo(0) on cancel. Command: adapt.
- [P3] Ritual cost at the edges (known, out of scope in #7 plan): 21 Tab stops; one-movie hat 6 s spin + "Spin again"; legend "not rated · not rated" on 6/7 rows. Command: polish / distill.

## Persona Red Flags
- Alex: 21 Tabs to Spin; no method/confirm shortcut; 6 s spin for one movie; quick double-click on double-feature "Pick something else" cancels both (undoable).
- Sam: main path solid; after a double-feature cancel focus → body, no announcement of the new tonight's movie.
- Casey: wheel stub above the confirmed card; h1 under the toast after cancel; "Third feature" overflows 293 px with tonight's rows under the tab bar.
- Couch pair: idle TV shows two lit buttons + stale "Lights down" while title and first feature fade to ~2.3:1; second movie presented as "tonight's"; "Tap the wheel" on a TV; trackpad double-tap on confirm now safe.

## Minor Observations
- "Everything is out for tonight" drops the "Rate it after watching" reminders.
- "Not tonight" has two Undos in a row (inline, then a toast after the respin).
- At 1440 the toast (y 812–876) overlaps the tonight card's bottom-right corner (card ends at 821).
- Phone podium: "N more" open pushes the CTA to y 880; posters cut off at the top.
- "Change how we pick" on a confirmed stage stays bright and silently starts a double feature.
- "Third feature" at 1440 overflows 186 px; two of three reminders below the fold.

## Questions to Consider
- Why is any button on the all-evening screen at full brightness? Idle = poster + title only?
- Is a double feature one decision (a programme) or two stacked picks?
- Is "Lights down. Enjoy the movie!" a moment or a state?
