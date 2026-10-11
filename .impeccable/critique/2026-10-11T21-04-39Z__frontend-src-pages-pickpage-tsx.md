---
target: pick
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:5efa96ff9b9a69c40f6ab1e820af34f7c4617223a18691ae9c32a53d0ff50976"
target_path: "D:\\Script\\WSCode\\Python\\Movie_Night\\movie-night\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-11T21-04-39Z
slug: frontend-src-pages-pickpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Readout, legend, "Out for tonight. Picking again…", "Out tonight" line; on phones a respin plays off-screen |
| 2 | Match System / Real World | 3 | Hype in words reads naturally; "1 more in the hat" on a ranking mixes metaphors |
| 3 | User Control and Freedom | 3 | Skip, inline + toast Undo, Bring it back; "Pick something else" doesn't unconfirm |
| 4 | Consistency and Standards | 2 | 4 primary-button recipes; method name 3×; winner poster twice on Top Rated |
| 5 | Error Prevention | 3 | Not tonight safe; confirm is one-tap with no take-back |
| 6 | Recognition Rather Than Recall | 3 | Legend/readout/out-tonight good; winner slice label always vertical |
| 7 | Flexibility and Efficiency | 3 | Skip + shorter respins; 16 tabs to Spin, no confirm shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | Toast pile-up in Not-tonight flow, repeated labels/poster |
| 9 | Error Recovery | 3 | Undo paths good; real errors still global toast + reset |
| 10 | Help and Documentation | 3 | Taglines and tap hints in context |
| **Total** | | **29/40** | **Good** |

## Design Specificity Verdict
Stage authored for the product (wheel, legend, winner card with names, couple-colored confetti, Not-tonight Undo). Choose stage still generic (deliberately left for shape). Top Rated consistent but not more specific (ranking + card, poster twice). Detector: 0 findings in CLI (PickPage + 12 Pick components + NavIcons + buttonStyles) and in 5 browser states.

## What's Working
1. Not-tonight recovery loop (PickPage.tsx:225-249, PickActions.tsx:101-121).
2. Spin skip lands on the same spot; tap/Space/Enter; respects other controls (SpinWheel.tsx:176-208).
3. Stage fits 1440×900 and 1280×800; names in their colors.

## Priority Issues
- [P1] Phones: respin plays off-screen (scroll stays at the old winner card; wheel above the viewport, top toasts cover it). Fix: scroll stage to top on new spin below lg; bottom toasts on the Pick stage on phones. Command: adapt.
- [P2] Winner slice label always vertical under the 12 o'clock pointer (SpinWheel.tsx:320-332). Fix: horizontal winner plate under pointer/hub, or pointer at 3 o'clock. Command: typeset/delight.
- [P2] Consistency: 4 button recipes (PickPage.tsx:68, buttonStyles.ts, PickActions.tsx:46/:69), method name 3×, winner poster twice on Top Rated, podium posters lazy (blank 2.7 s on cold load). Command: polish.
- [P2] Flat ending: "Rate it after watching" is the blue CTA after confirm; "Pick something else" keeps the confirmation (PickPage.tsx:267). Fix: celebrate confirm, Rate secondary, unconfirm or relabel. Command: delight + clarify.
- [P3] Toast pile-up after Not tonight (Undo toast lingers 8 s, overlaps card at 1440); "Out tonight" line makes phone bar 3 lines, covering Genre. Fix: dismiss Undo toast when next pick lands; one-line "1 out · Bring back" on phones. Command: harden.

## Persona Red Flags
- Alex: 16 tabs to Spin; no confirm/respin shortcut; full 5.8 s after Change how we pick; no "take #2".
- Sam: skip not announced; "Picking again…" not live; toasts role=status inside aria-live (double).
- Casey: respin off-screen; Top Rated CTA below fold; top toasts cover wheel; choose overflows 29 px.
- Couch pair: vertical winner label; stage x=32 vs nav x=167; 14 px toasts/out-tonight; 1280 legend clips first row mid-spin.

## Minor Observations
- Top Rated 1280×800 18 px scroll; long "Not tonight" copy with link-like underline; confetti continues after back to choose; TIME/GENRE 14 px muted.

## Questions to Consider
- Pointer at 3 o'clock toward the winner card?
- Top Rated: countdown reveal, or drop the theatre?
- After confirm: go "lights down"?
