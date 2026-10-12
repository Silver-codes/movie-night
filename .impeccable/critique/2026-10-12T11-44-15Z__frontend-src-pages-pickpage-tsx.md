---
target: pick
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
target_fingerprint: "sha256:4f36bc22f67e22d6a050abca6c349421c6a86c5a9a8c679dc246164e583dfbfe"
target_path: "D:\\Ostatní\\Script\\study\\Python_Lessons\\Movie_project\\frontend\\src\\pages\\PickPage.tsx"
timestamp: 2026-10-12T11-44-15Z
slug: frontend-src-pages-pickpage-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spin status excellent; a confirmed pick is forgotten on reload of /pick |
| 2 | Match System / Real World | 3 | Warm voice; "Tap the wheel…" on laptop/TV |
| 3 | User Control and Freedom | 3 | Undo / Pick something else / Didn't watch it; inline Undo only 1.5 s |
| 4 | Consistency and Standards | 3 | Top Rated: no chime, no phone auto-scroll to the card (wheels have both) |
| 5 | Error Prevention | 3 | Tonight's confirmed movie stays in the hat and can be re-spun |
| 6 | Recognition Rather Than Recall | 3 | Tonight's pick looks like any older reminder |
| 7 | Flexibility and Efficiency | 2 | ~24 tab stops to Spin with 3 reminders; no spin shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | Strong stage; reminder stack heavy; "not rated ×2 · No hype yet" row on Random |
| 9 | Error Recovery | 3 | Failures keep the stage; expired confirm not exercised |
| 10 | Help and Documentation | 3 | Taglines, skip hint, odds legend explain fairness |
| **Total** | | **30/40** | **Good** |

## Design Specificity Verdict
Stage authored for the couple (popcorn hub, bulbs, hype plinths, names in their colors, lights down). Choose stage still generic, reserved for shape. Detector: CLI 0 findings over 17 files; browser 0 findings in 6 states (1440 choose/landed/confirmed/podium; 375 choose-with-reminder/confirmed). Nested-cards from #5 gone.

## What's Working
1. Lights Down authored: stage + back row dim, news written on the card, focus on a named group, no duplicate live region; wheel stages fit 1440×900 and 1280×800 with 0 px overflow in every state.
2. Fairness visible: odds legend, row lights under the pointer, "More hype, bigger slice".
3. Focus management deliberate at every transition (spin → region, landed → h2, Not tonight → Undo → h2, confirm → news, back/unconfirm → method radio).

## Priority Issues
- [P1] Tonight's decision evaporates after leaving /pick: reload shows a fresh choose stage, the confirmed movie still counts in the hat, and appears as one of N equal reminders (not newest first). Fix: when a pick is confirmed for the current movie-night date, open /pick on a "Tonight: X" decided card (Pick something else, Rate later, quiet "Pick another anyway"); fold older reminders; sort newest first. Command: harden (+ clarify).
- [P2] Reminders lead the choose stage on sm+: 2 reminders overflow 54/154 px (1440/1280), 3 → 146/246 px; GENRE under the sticky bar. Fix: one slim summary row ("N picks waiting for a verdict"), expandable, or after the filters on all widths. Command: distill / layout.
- [P2] Top Rated breaks the fit contract: 1280×800 podium +18 px closed, +109 px with "N more" open; 1440×900 +49 px open. Fix: cap the open list (dvh-bound, internal scroll) or shrink the podium while details[open]. Command: adapt.
- [P2] Phone Top Rated: CTA ~400 px below the fold after the podium lands; podium passes scrollIntoView={false} while wheels auto-scroll. Fix: scroll the card to nearest after PODIUM_LANDED_MS + pause. Command: adapt.
- [P3] Reveal noise: "Fuf not rated · Cookie not rated · No hype yet" row; 1.5 s inline Undo with the faded CTA dominating. Fix: one line for no hype; ~3 s window, hide CTA row while leaving. Command: distill + harden.

## Persona Red Flags
- Alex: ~24 tabs to Spin; no spin shortcut; 5.8 s first spin unless skipped.
- Sam: podium buttons "Choose {title}" don't say place/hype; reminder link name is only the title.
- Casey: Top Rated CTA below fold; lone sound toggle above the card after scroll; lights down invisible on phone.
- Couch pair: 1.5 s Undo too short for two; 14 px muted taglines; 2 px chosen ring faint from 3 m; Top Rated confirms silently.

## Minor Observations
- Possible legend/pointer frame lag at full speed (one frame).
- Sound toggle stays under the dimmed wheel after confirm.
- Weighted: biggest slice gets the most truncated label.
- No-backdrop fallback reads as a pink haze; same poster twice on Top Rated at 1440.
- One Light Source rule text ("two blue = one wrong") contradicts its own action + winner allowance: reword the rule, not the UI.
- "Rate it after watching" right after confirm could read "Rate it later".

## Questions to Consider
- Once tonight is decided, should /pick say "Spin the wheel" again before 06:00?
- Is the choose stage a form or a curtain (shape)?
- Why is the podium's decision less of an occasion than the wheel's?
