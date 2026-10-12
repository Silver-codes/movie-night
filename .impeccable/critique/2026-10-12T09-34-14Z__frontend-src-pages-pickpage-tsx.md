---
target: pick
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:346368f7881cd01ee7c717972ebd6c18c0eabc59a80fa3206ea069f77a6fa36f"
target_path: "D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-12T09-34-14Z
slug: frontend-src-pages-pickpage-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spin/landed/decided clear; during "Not tonight" the card stays fully lit, only a small "Picking again…" line |
| 2 | Match System / Real World | 3 | Hat, podium, Lights down, Not tonight coherent; "Tap" wording on laptop/TV |
| 3 | User Control and Freedom | 3 | Undo, take back confirm, Didn't watch it, skip spin; focus lost after each |
| 4 | Consistency and Standards | 3 | One PickWinner for all; Decided is a card inside the card; hype row wraps at 1280 on Top Rated |
| 5 | Error Prevention | 3 | Recoverable everywhere; "Pick something else" next to Rate without confirm (recoverable) |
| 6 | Recognition Rather Than Recall | 3 | Tagline + live hat count; podium places don't look choosable |
| 7 | Flexibility and Efficiency | 2 | Space skips the spin only; no keys for confirm / spin again / method |
| 8 | Aesthetic and Minimalist Design | 3 | Strong stage restraint; nested card at the peak; grey smudge without backdrop |
| 9 | Error Recovery | 3 | "No movie fits" + Clear filters, "Everything is out" + Bring them all back |
| 10 | Help and Documentation | 2 | Nothing explains tap-to-choose on the podium, the Weighted %, or that Not tonight expires |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict
Stage authored for the product (grey wheel with one blue slice, couple-colored confetti, 2-1-3 podium with hype plinths, "It's decided, Fuf & Cookie", Out tonight · Bring it back). Generic: choose stage (reserved for shape) and the Lights-down moment, which reads as a box, not a dark room. Detector: CLI 0 findings over 16 files; browser 0 findings in 4 of 5 states, 1 `nested-cards` in the confirmed state (PickActions.tsx:113 inside PickWinner.tsx:87), true positive, agrees with the review.

## What's Working
1. One Light Source genuinely applied: only the winning slice / chosen poster ring + the confirm button are blue.
2. Warm, honest copy at the fairness moments ("More hype, bigger slice", "A coin flip chose this one", "6 hype together / so far").
3. Recoverability built in: inline Undo → toast → Bring it back; Pick something else unconfirms; Didn't watch it next day.
Fixed since #4: phone respin scrolls back (p04), button recipes unified, toasts moved on phone stage, confirm can be taken back, Lights down exists.

## Priority Issues
- [P1] Lights down under-delivers and is a nested card. Only the wheel/podium column dims; nav, back row and method name stay lit; Decided is ink-800 ringed card in ink-900 card (detector nested-cards); landing confetti keeps falling over the decided state; on phones the dimmed wheel is off-screen and the Decided box sits under the tab bar (p06). Fix: drop the inner card's fill/ring, stopConfetti on confirm, dim the back row/method name too (or a room scrim), on phones scroll Decided clear of the tab bar. Command: delight then polish.
- [P1] Focus falls to <body> after inline Undo, after "Change how we pick", after "Pick something else" (measured). Fix: focus Not-tonight button/winner h2 after Undo; focus the method radio / Spin button after back and after unconfirm (PickPage.tsx:304-307, 325-346; PickActions.tsx:68-80). Command: harden.
- [P1] Top Rated "take any place" not discoverable, and choosing #2 leaves no trace on the card. Fix: muted hint under the podium ("Not feeling #1? Tap another place."), neutral "#2 · your pick" tag on the card when not #1 (TopRatedPodium.tsx:159-168, 224-239). Command: clarify.
- [P2] Phone choose stage with a RateReminder: sticky "in the hat" bar covers the TIME chips, GENRE below the fold (p01). Fix: compact RateReminder to one row on phones, shorter/hidden subtitle on phones, or bar not sticky while it fits (PickPage.tsx:402-438, RateReminder.tsx). Command: adapt.
- [P2] Winner card without a backdrop shows an empty grey gradient; on Top Rated (no poster either) the title floats in a void (d13, d09, p05, p07). Fix: blurred poster as backdrop fallback, or collapse the area; show the poster on Top Rated when there's no backdrop (PickWinner.tsx:265-274). Command: harden.

## Persona Red Flags
- Alex: no keys for confirm / spin again / method; "N more in the hat" resets each pick.
- Sam: focus to body ×3; card doesn't say "your pick: #2"; Decided role=status + focus may double-announce.
- Casey: filters under the sticky bar; Decided clipped by tab bar; "Silhouettes: The James.." two-dot truncation on phone podium.
- Couch pair: "Tap" copy with mouse/remote; small hint text from 2–3 m; eyes jump wheel-left → card-right.

## Minor Observations
- Weighted wheel: biggest slice gets the shortest label; legend not sorted by chance.
- Sound toggle jumps when the hint disappears during Not tonight.
- Podium with "N more" open scrolls 49px at 1440×900.
- Test DB: a watchlist movie carries watched_on + verdicts (data, not UI).

## Questions to Consider
- If Lights down is the peak, why does the app chrome stay lit?
- Is Top Rated now "our shortlist", with #1 as a suggestion? Should the copy say so?
- On a TV, should the landed state offer one obvious next step and hold the other two back a beat?
