---
target: pick
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:e374fe94962e0461038cbf491332d9947336a7c49cc4e6a22bdeae23498325d0"
target_path: "D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-11T18-25-48Z
slug: frontend-src-pages-pickpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Pointer readout, legend highlight, aria-live work; no sign of how long a spin has left |
| 2 | Match System / Real World | 3 | "9 ★" on the plinth reads as a 9-star rating; "Hype total 9" unexplained |
| 3 | User Control and Freedom | 2 | No Undo for "Not tonight"; the spin can't be skipped |
| 4 | Consistency and Standards | 2 | 4 primary-button recipes; wheel winner = card vs podium = bare text; method label twice |
| 5 | Error Prevention | 2 | "Not tonight" is a one-tap write under the CTA that respins at once |
| 6 | Recognition Rather Than Recall | 3 | Legend good; movies skipped tonight are invisible on the Pick page |
| 7 | Flexibility and Efficiency | 2 | Every respin is another unskippable 5.8 s; no shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Strong stage; duplicate respin affordances and method labels |
| 9 | Error Recovery | 2 | Errors = global toast + reset; accidental skip only fixable in the drawer |
| 10 | Help and Documentation | 3 | Method taglines explain the rules in context |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict
Stage (wheel, legend, winner card, stage mode) is authored for this product. The choose stage (radio cards + chip rows + CTA bar) and the Top Rated decision column are category-generic. Detector: 0 findings in the CLI (PickPage.tsx + 9 Pick components) and in all 4 browser states; no false positives.

## What's Working
1. WheelLegend + pointer readout (full titles, posters, both people's stars, odds in sync with the pointer; "now passing" strip on phones).
2. Stage mode fits 1440×900 exactly for both wheels.
3. Keyboard/SR basics: focus to winner h2, real radios, aria-live result, aria-pressed chips (#2 leftover fixed).

## Priority Issues
- [P1] "Not tonight" has no Undo and skipped movies are invisible (PickPage.tsx:167-177, toast.ts has no action). Fix: Undo action on the toast, respin after ~1.5 s, "1 out tonight · Bring back" on choose. Command: harden.
- [P1] Spin can't be skipped (SpinWheel.tsx:157-160, 5.8 s). Fix: tap/Space while spinning finishes in a 0.6 s glide (reduced-motion path); shorter respins (~3.5 s). Command: animate.
- [P2] Top Rated payoff weak + overflows 1440×900 by 78px (row #4 cut) + ambiguous "9 ★"/"Hype total" (TopRatedPodium.tsx:122-144). Fix: reuse the PickWinner card, "9 hype" or "5 + 4", fit the podium / fold #4+. Command: layout + clarify.
- [P2] Choose stage generic; on 375px the sticky bar hides the Time/Genre filters. Fix: show the hat (pickable posters), filters above cards or one "Filters" chip on phones. Command: shape pick, then adapt.
- [P3] Four primary-button recipes (buttonStyles.ts, PickPage.tsx:64, PickActions.tsx:42/:65); six blue things after landing incl. blue confetti (confetti.ts:1). Fix: one helper, confetti in person colors + fg. Command: polish + quieter.

## Persona Red Flags
- Alex: unskippable spin; "Not tonight" forces a full respin; no shortcuts; ~16 tab stops to the CTA.
- Sam: nothing actionable during the spin; "9 hype" opaque; no announcement of what "Not tonight" removed.
- Casey: filters under the sticky bar; wheel scrolls away at landing; "Not tonight" close under "Spin again"; podium titles truncated (no shortTitles); #4 under the tab bar.
- Couch pair: wheel labels truncated on big slices (SpinWheel.tsx:84-88); stage at x=32 vs nav at x=167; "Hype total 3" vs "not rated".

## Minor Observations
- Method label twice; vertical labels near 12/6 o'clock; empty right half for ~1 s during the podium reveal; podium posters lazy above the fold; quiet "Enjoy the movie!" end; "Not tonight" copy too long.

## Questions to Consider
- Should Top Rated's moment be a visible coin flip on ties instead of a reveal?
- Should "Not tonight" be a per-person veto with a budget?
- Why is the choose stage a form instead of opening on the loaded wheel?
