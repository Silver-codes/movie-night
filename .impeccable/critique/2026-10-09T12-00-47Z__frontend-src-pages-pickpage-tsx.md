---
target: pick
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:8202fc617f5a3c0ab3326bce09ea08093d03dec53a4513ca67810ee8ba8d8ac5"
target_path: "D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-09T12-00-47Z
slug: frontend-src-pages-pickpage-tsx
closed: true
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live "N movies in the hat", "Picking…" and aria-live result are good; mid-spin only "4 movies on the wheel" |
| 2 | Match System / Real World | 3 | Hat / wheel / podium / coin flip land well; "Hype total 10" and "10 ★" say the same thing two ways |
| 3 | User Control and Freedom | 3 | "Change how we pick" always there; Top Rated "Back" skips the podium; 5.8s spin can't be skipped |
| 4 | Consistency and Standards | 2 | Top Rated needs two confirms, wheels one; 3 primary-button styles; One Light Source rule broken |
| 5 | Error Prevention | 3 | Spin disabled at 0 with Clear filters; "Not tonight" writes with no undo |
| 6 | Recognition Rather Than Recall | 3 | Method + filters in the URL; taglines explain methods |
| 7 | Flexibility and Efficiency | 2 | 18 Tab stops to Spin; no shortcut for spin/spin again; no fast-forward |
| 8 | Aesthetic and Minimalist Design | 3 | Calm, but the header stays the same during the spin; default "Any" chips lit blue |
| 9 | Error Recovery | 3 | Clear filters, "Bring them all back", ErrorState all solid |
| 10 | Help and Documentation | 2 | Taglines only; Random Wheel shows no odds, Weighted shows them at 11px |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

LLM: half authored, half generic. The reveal (marquee wheel with bulbs and popcorn hub, ticks, podium springing #1 in last, both people's stars on the winner) belongs to this product. The choose stage (three option cards + two chip rows + CTA bar) could be any SaaS plan picker; the couple is invisible until the winner appears.

Deterministic scan: CLI detect over 12 Pick files: 0 findings. In-page detector: choose stage clean (desktop + 375px); landed wheel 1 finding (dark-glow on "We're watching this!", PickWinner.tsx:142 — soft, offset shadow at 20%); podium 4 findings: dark-glow zero-offset 60px accent halo on #1 poster (TopRatedPodium.tsx:50, true), low contrast 4.4:1 "10 ★" text-ink-950/70 on accent (TopRatedPodium.tsx:84, true), dark-glow on "Pick …" button (TopRatedPodium.tsx:102, soft), skipped heading h1→h3 on podium (TopRatedPodium.tsx:65, true). No console errors, no overflow at 375px, muted text 7.57:1.

## Priority Issues

1. [P1] Not composed for the couch. Wheel capped at max-w-md (~440px, SpinWheel.tsx:94) in a 1152px container; on 1920×1080 it fills <25% of width. Secondary text 11–14px (taglines, xs stars, "10 ★", wheel labels, percentages). Fix: "stage mode" once a pick starts — collapse header to a back row, wheel ≈ min(70vh, 48vw), ≥18px secondary text at lg+, bigger avatars/stars on the winner. Command: /impeccable adapt pick (then layout).
2. [P1] Top Rated flow breaks at the climax. At 1440×900 the #1 plinth and "Pick …" CTA are below the fold (~y=1015); "Pick X" is a fake decision before the real "We're watching this!"; "Back" from winner skips the podium. Fix: cap podium poster height so podium + CTA fit 900px; make the podium CTA the real confirm (with Not tonight / Back beside it) or route Back to the podium. Command: /impeccable layout pick.
3. [P1] One Light Source rule broken. ~7 blue elements on the choose stage (nav pill, logo, selected card ring+fill+icon tile, both default "Any" chips, CTA); landed wheel adds blue bulbs (SpinWheel.tsx:134), pointer dot, hub ring, badge text, zero-offset halo on podium #1. Fix: neutral bulbs, ink hub/pointer until landing, "Any" chips neutral, neutral icon tile on selected card, muted badge, drop the halo. Command: /impeccable quieter pick.
4. [P2] Lopsided spin and weak winner card. lg:grid-cols-2 (PickPage.tsx:339) leaves the right half empty for the whole 5.8s peak; with no TMDB backdrop the winner card is a large grey blur; confetti sits over the winner text. Fix: center the wheel alone while spinning, animate into two columns on landing; cap/replace the missing backdrop with the poster-derived treatment. Command: /impeccable layout pick.
5. [P2] Choose stage reads as a form, not a ritual. ~15 controls, genre row unbounded, filters always open, the two people absent. Fix: filters behind "Narrow it down" with a one-line summary, Spin as the next big thing after method, show the two avatars and poster thumbs as "the hat", cap genre chips. Command: /impeccable distill pick (then delight).

## Persona Red Flags

Alex (power user): every spin and re-spin is a fixed 5.8s with no tap-to-skip; Top Rated takes 3 clicks plus a 1.1s delay before the CTA appears (TopRatedPodium.tsx:97); no shortcut for Spin / Spin again.
Sam (keyboard / screen reader): 18 Tab stops to reach Spin; single-select filter chips are aria-pressed toggles rather than a radiogroup; plinth reads "1, 10 black star"; podium h3 under h1.
The Couch Couple (TV at 2–3 m): only title and big buttons legible; the fairness signal (who rated what) is xs stars and 20px emoji avatars; two "Harry Potte…" wheel labels indistinguishable; podium CTA needs a scroll; confetti over winner text.

## Minor Observations

- Header title and subtitle never change across stages.
- Winner scrollIntoView jumps the page ~15px at landing.
- Random Wheel shows no odds ("1 in 4" would reinforce fairness).
- Two sound toggles, different sizes (size-12 vs size-9).
- "Not tonight" toast has no Undo.
- Phone podium hides the stars (hidden sm:flex).
- Three different primary-button class strings.

## Questions to Consider

- If the pick is the heart of the product, why does the page open on a form instead of the wheel already loaded with tonight's movies and one big Spin?
- Is the Top Rated podium a reveal or a confirmation dialog in disguise? Could the podium itself be the moment of commitment?
- Where are Fuf and Cookie before the winner? Could the wheel show both people's hype while it spins, so fairness is visible, not explained afterwards?
