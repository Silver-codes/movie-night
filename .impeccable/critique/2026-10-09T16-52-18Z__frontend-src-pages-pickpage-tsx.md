---
target: pick
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:73a1b5d1124a134a54ec07df5b2d9d879703572f65046351f69c711191170f9d"
target_path: "D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-09T16-52-18Z
slug: frontend-src-pages-pickpage-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "N movies in the hat", "Picking…" and the aria-live result are good. Mid-spin only says "4 movies on the wheel". The winner poster and backdrop show as blank ink while TMDB loads. |
| 2 | Match System / Real World | 3 | Hat, wheel, podium and coin flip work. "9 ★" on a plinth reads as nine stars on a 5-star scale, and "Hype total 9" never says it's out of 10. |
| 3 | User Control and Freedom | 3 | "Change how we pick" is always there. The 5.8s spin can't be skipped, and "Not tonight" has no Undo. |
| 4 | Consistency and Standards | 3 | Much improved. Still 4 primary-button class strings, 2 sound-toggle sizes, and the method name shown twice in the stage. |
| 5 | Error Prevention | 3 | Spin is disabled at 0 with Clear filters offered. Confirm is a single click. |
| 6 | Recognition Rather Than Recall | 2 | Every wheel slice reads "Harry Potte…", so nobody can tell which slice is which. |
| 7 | Flexibility and Efficiency | 2 | No skip or fast-forward for the spin, no Space/R shortcut, 16 Tab stops to reach Spin, and no skip link. |
| 8 | Aesthetic and Minimalist Design | 3 | Stage mode is calm. The right half is empty while it spins, and the choose stage leaves dead space at TV size. |
| 9 | Error Recovery | 3 | Clear filters, "Bring them all back" and ErrorState with retry are all solid. |
| 10 | Help and Documentation | 2 | Taglines only. Random Wheel shows no odds, and the hype-total scale is never explained. |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** about two-thirds authored, one-third generic.
- Authored for this product:
  - The stages: a marquee wheel with white bulbs, popcorn hub and ticks, blue only on landing.
  - A podium where #1 springs in last.
  - Both people's names and stars on the winner.
- Generic: the choose stage is still the "icon tile + title + tagline" plan-picker trio, two chip rows and a CTA bar.
  - No posters and no Fuf or Cookie.
  - At 1920×1080 it's a small form in the top 60% of a black screen.

**Deterministic scan:**
- CLI `detect` over PickPage.tsx and 18 imported components: 0 findings.
- In the browser, 4 views (choose 1440/375, wheel landed, podium) gave 1 finding: low contrast 3.3:1 on the "not rated" label on the winner card (`text-faint` #626875 on ink-900, StarDisplay.tsx:32).
  - The same token measures 3.52:1 on the podium; the detector didn't flag it there, but it's real.
- No console errors and no horizontal overflow at 375px.
- Blue elements per view: 9–10. Most are shell elements (logo star, "Night" wordmark, Pick nav pill and its icon). The rest are the selected-card ring, the CTA, the winning slice and hub ring on landing, and the podium winner outline. Everything in the stages follows the One Light Source rule; the logo's decorative blue is the only remaining break.

## Priority Issues

1. **[P1] Wheel labels can't tell titles apart.** `truncate()` cuts from the end (SpinWheel.tsx:153,171), so with franchise titles all 4 slices read "Harry Potte…", and labels on the left half sit upside down. On the signature screen the couple can't follow the race to the pointer, and the Weighted percentages mean nothing.
   - Fix: strip the title prefix shared by all candidates ("…Goblet of Fire"), and/or add a legend beside the wheel while it spins (poster thumbnail, short title, odds).
   - Command: /impeccable clarify, then delight.
2. **[P1] The spin is lopsided and the landing breaks the no-scroll rule.** `lg:grid-cols-2` (PickPage.tsx:362) keeps the wheel pinned left with the right half black for the whole 5.8s peak. On landing the page is 941px tall, and `scrollIntoView` (PickWinner.tsx:30) scrolls 41px, tucking "Change how we pick" under the nav. That breaks DESIGN.md's "fits 1440×900 without scrolling", and the jump grew from about 15px last time.
   - Fix: center the wheel alone while it spins (or fill the right column with the hat legend), and animate into two columns on landing.
   - Fix: trim about 45px from the `100dvh − 15rem` budget, and drop the scroll at lg.
   - Command: /impeccable layout.
3. **[P2] The choose stage reads as a form, not a ritual, and isn't sized for the couch.** About 14 controls, filters always open, and an unbounded genre row (the union of every genre on the watchlist). No posters, no people, 14px taglines and chips, and about 400px of black below at 1920.
   - Fix: a "the hat" poster strip in the CTA bar.
   - Fix: collapse the filters to a "Narrow it down · Any length · Any genre" summary row, and cap genres at the top 4 plus "More".
   - Fix: secondary text at least 18px from lg.
   - Command: /impeccable distill, then adapt.
4. **[P2] Hype numbers are ambiguous.** "9 ★", "0 ★" and "Hype total 9" sit next to 5-star rows. The fairness signal should read at a glance.
   - Fix: "9/10 hype", or two stacked mini-bars in each person's color. Drop the ★ from totals.
   - Fix: raise "not rated" to `muted` to clear the 3.3:1 contrast failure.
   - Command: /impeccable clarify.
5. **[P3] Stage chrome is duplicated and there are no accelerators.**
   - Duplicates: the method name appears twice, two sound-toggle sizes, 4 primary-button class strings.
   - Missing: no way to skip the spin, no keyboard shortcuts, no Undo on "Not tonight".
   - Fix: one method label, and a shared stage-primary button style.
   - Fix: tap or Space fast-forwards the spin.
   - Fix: Undo in the "out for tonight" toast.
   - Command: /impeccable polish.

## Persona Red Flags

**Alex (power user):**
- Every spin is a fixed 5.8s with no skip.
- No Space/Enter or R shortcut.
- 16 Tab stops to Spin.
- A mis-clicked "Not tonight" costs a re-pick plus a trip to the watchlist.

**Sam (keyboard / screen reader):**
- Single-select filter chips are `aria-pressed` toggles, not a radiogroup.
- The aria-live "landed on X" plus the focused winner h2 may announce the result twice.
- While spinning, the wheel's label only gives the count, not which movies are on it.
- Escape does nothing in the stage.
- "not rated" is 3.3:1.

**The Couch Couple (TV at 2–3 m):**
- Identical "Harry Potte…" slices.
- Black right half during the spin.
- Choose-stage taglines and chips are unreadable from the couch.
- The Top Rated decision panel shows avatars only, with no names (TopRatedPodium.tsx:139-142), against DESIGN.md's "each person's name and large stars on the winner".
- Confetti drifts over the winner text and the CTA.

## Minor Observations

- At 1440 the stage breakout puts "Change how we pick" at x≈34 while the logo is at x≈167, so the stage feels detached from the chrome.
- The winner poster and backdrop render as flat ink while loading, with no shimmer or fade.
- The podium decision column is bottom-aligned, leaving empty space top-right, and the plinths have no floor line.
- On phones the podium hides the stars (`hidden sm:flex`) and truncates titles.
- On phones the landed winner pushes the wheel off-screen while "Tap the wheel to spin again" stays visible.
- "Not tonight. Leave it out and pick again": a period inside a button label reads oddly.
- After confirming, "Pick something else" returns to choose without un-confirming, so its meaning is unclear.
- Random Wheel shows no "1 in 4" odds.

## Questions to Consider

- Why does the page open on a form? Could it open on the wheel already loaded with tonight's hat, with method and filters as small toggles around it and one huge Spin?
- Fairness is the promise. Why is it only shown after the result? Could the legend show both people's hype in their colors while the wheel spins?
- Should the suspense be about which movie, or about whose favorite?

## Since the last critique (27/40)

**Fixed:**
- Stage mode, with the header collapsed and a big wheel.
- The Top Rated double confirm, and the CTA below the fold.
- Most One Light Source violations: bulbs, pointer, "Any" chips, icon tile, the #1 halo.
- The "10 ★" contrast failure.
- The h1→h3 heading skip.

**Still open:**
- The lopsided spin.
- The choose stage reading as a form.
- Unskippable spin and no shortcuts.
- No Undo.
- No Random odds.
- The sound toggles and button strings.
- Phone podium stars.
- `aria-pressed` chips.

**Worse:**
- The wheel labels (all 4 slices now identical).
- The landing scroll jump (15px → 41px).

The score is the same 27/40 as last time, but the problems are different. The old P1s are gone, and the new P1s are about how well people can read and follow the wheel itself.
