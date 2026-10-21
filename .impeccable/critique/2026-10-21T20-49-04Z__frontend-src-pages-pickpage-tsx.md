---
target: pick
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:35d80e7e6124997008125d6316b8c53ccf2ca66acfe327bdf704ca8ee3b4edd7"
target_path: "D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-21T20-49-04Z
slug: frontend-src-pages-pickpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score (#6) | Key Issue |
|---|-----------|-----------|-----------|
| 1 | Visibility of System Status | 4 (3) | Decision survives reload ("Weighted Wheel pick, decided at 22:40."), tonight's picks tagged, live hat count. Gap: a double feature shows only the newest movie |
| 2 | Match System / Real World | 3 (3) | Warm voice; "Tap the wheel to skip" on a laptop, "Didn't watch it" on a movie picked minutes ago, "Lights down. Enjoy the movie!" hours later |
| 3 | User Control and Freedom | 3 (3) | 3 s Undo with the buttons hidden; no way back from "Double feature?" to tonight's card |
| 4 | Consistency and Standards | 3 (3) | Top Rated now scrolls to the card on phones like the wheels; the podium still confirms silently |
| 5 | Error Prevention | 2 (3) | New: a second click after "We're watching this!" lands on "Pick something else" / "Rate it after watching" |
| 6 | Recognition Rather Than Recall | 3 (3) | Reminders newest first, tagged, named; the first movie of a double feature drops off the tonight page |
| 7 | Flexibility and Efficiency | 3 (2) | Reminders out of the tab path, Space skips; still 21 tab stops to Spin at 1440/1280 (13 chips) |
| 8 | Aesthetic and Minimalist Design | 3 (3) | Strong stages; tonight page lopsided at 1440; spin legend still "not rated · not rated" |
| 9 | Error Recovery | 2 (3) | "X isn't tonight's pick anymore" toast has no Undo; a cancelled wheel result can't be restored |
| 10 | Help and Documentation | 3 (3) | Taglines, odds legend, tie note and empty-state copy explain it |
| **Total** | | **29/40** | **Good** |

## Design Specificity Verdict
Stage authored for the couple (popcorn hub, bulbs, confetti in their colors, "It's decided, 🐻 Fuf & 🍪 Cookie", room dimming on confirm). Choose stage still a generic form (reserved for shape). The new "Tonight we're watching" page has the right idea and the wrong look: left-aligned 768 px card with ~500 px empty at 1440, nothing dimmed, nav fully lit; the screen left up all evening reads as an ordinary page.
Detector: CLI 0 findings over 17 Pick files (exit 0); browser detector injected in 10 captures (5 states × 1440/375): "No anti-patterns found" in every one; 0 console/page errors; no horizontal overflow. Vertical overflow: tonight +49/+166, choose +54/+173, landed 0/+469, confirmed 0/+403, podium open 0/+515 (1440/375). Everything below is behavior or composition the detector can't see.

## What's Working
1. #6's P1 fixed: reload opens the decided card with method + time; the confirmed movie is out of the hat; reminders newest first and tagged.
2. Layout holds: Spin at y=614 on 1440 and 1280 with or without reminders; opening "N more" doesn't move the CTA; ranking ends at 877 / 777 px with the list open.
3. Not tonight calmer: 3 s Undo, card height unchanged, focus Undo → h2; "No hype yet" one line; podium places named "2nd place: …, 3 hype".

## Priority Issues
- [P1] Confirm misfire: within 250 ms of "We're watching this!", "Pick something else" and "Rate it after watching" render under the cursor (1440 Top Rated: the click point becomes "Pick something else"; 1280: "Rate" overlaps the CTA). Reproduced: double-click + 1 → "Order of the Phoenix isn't tonight's pick anymore"; another run opened /watchlist. Destroys the peak with no Undo. Fix: Decided actions inert until the entrance settles (~700 ms), moved off the CTA footprint, Undo on the cancel toast (restore the confirmed pick). Command: harden.
- [P2] Tonight page isn't the lit screen: left-aligned with right ~40% empty at 1440, "Double feature?" centered under the card; on 375×812 the actions start under the tab bar (page overflows 166 px); a double feature shows only the newest movie. Fix: center/break out like stage mode with the room dimmed, "Also tonight: X", compact phone card. Command: layout + delight.
- [P2] Double-feature path loses its way: header still "What are we watching?", no "← Back to tonight", phones open scrolled 128 px, identical "Tonight's pick" tags, "Didn't watch it" on a movie picked minutes ago. Fix: "Second feature" header + back link, scroll to top, "1st / 2nd feature" tags, "Take it back" for tonight's rows. Command: clarify.
- [P3] Ritual cost at the edges: 21 tab stops to Spin (each chip a stop); a one-movie hat still spins 5.8 s with a truncated label. Fix: one tab stop per chip row with arrow keys (~10 to Spin); "Just one in the hat: X" with a short spin or straight to the card. Command: polish.
- [P3] Spin legend: unrated rows still "🐻 not rated 🍪 not rated"; use one muted "No hype yet" like the card. Command: distill.

## Persona Red Flags
- Alex: 21 tabs to Spin, no choose-stage shortcut, 5.8 s spin for a one-movie hat; fast double-click hits P1.
- Sam: second Enter after confirm is safe (focus moves to the news); tonight page never mentions the first double-feature movie; taking back tonight's pick is named "Didn't watch X".
- Casey: tonight page actions under the tab bar; double-feature choose stage opens scrolled 128 px; opening "N more" puts the CTA ~412 px below the fold; lights down invisible (wheel scrolled away).
- Couch pair: trackpad double-tap cancels the pick; tonight page reads as a list page from 3 m; podium confirms silently; 2 px ring on the chosen poster faint at distance.

## Minor Observations
- Compact podium at 1280: "Order of the Phoenix" wraps to 3 lines.
- Sound toggle stays under the dimmed wheel after confirm.
- DESIGN.md One Light Source wording ("two blue = one wrong") contradicts the selected-poster + CTA pair it allows: reword the rule.
- Phones: tonight's reminder hides "Rate it after watching"; the purpose relies on the row being known as tappable.
- Tonight page's "Pick something else" cancels only the newest pick.
- Open podium at 1440 measured 0 overflow with 3 rows; the 6-row case was measured in the adapt pass only.

## Questions to Consider
- Should "Tonight we're watching" be a full-bleed "now showing" marquee left on the TV, not a card on a page?
- Is a double feature a ritual worth naming (1st / 2nd feature), or rare enough to stay a quiet link?
- With one movie in the hat, is a 5.8 s spin a ritual or a joke at their expense?
