# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Exactly two people who watch movies together, by default **Fuf** and **Cookie** (both renamable in the app, each with their own emoji and color). They share one device and mostly use the app together on a **laptop or TV-sized screen**, sitting side by side for the evening pick. The phone (same Wi-Fi, production mode) is a secondary way in.

There are no other audiences: no guests, no accounts, no public visitors.

## Product Purpose

Movie Night ends the nightly "what do we watch?" debate. During the week the two save movies from TMDB to a shared watchlist and each give them 1–5 **hype** stars. On movie night the app picks for them: top rated by combined hype, a fair random wheel, or a wheel weighted by hype. After watching, each gives a **verdict** and an optional note, and the movie moves to a shared history.

Success: picking takes a minute, feels fun and fair to both people, and nobody has to be the one who decides.

## Positioning

A private ritual for two specific people, not a movie database or a social app. The **pick** is the heart of it. Saving, hype stars and "Not tonight" exist to feed the pick. History and the "Fuf vs Cookie" stats are a fun extra, not the core job. Every pick method draws only from pickable movies, and the server, not either person, chooses the winner, so the result is neutral.

## Operating Context

- **During the week:** search TMDB, add to the watchlist, hype-rate (either person can rate for both).
- **Movie night (the main moment):** together in front of a laptop/TV, optionally narrow by max runtime or genre, take movies out with "Not tonight" (expires on its own the next movie night; nights roll over at 06:00), pick by podium or spinning wheel, confirm "We're watching this!".
- **After watching:** mark watched with a date, both verdicts and notes; fill in later from the drawer if needed. A confirmed pick still on the watchlist nudges "Rate it after watching".
- Runs locally: `npm run dev` on the computer, or `npm start` to serve on the LAN for a phone.

## Capabilities and Constraints

- Two fixed person **slots** (`fuf`, `cookie`), never users or accounts. Display names, emoji and colors come from the people profiles and must never be hardcoded in the UI.
- No login, no auth, no permissions: either person can edit everything, including the other's stars.
- Stars are whole numbers 1–5 or empty; tapping the current star again clears it.
- Terminology: **watchlist**, **hype**, **verdict**, **pickable**, **Not tonight** (skip tonight), **pick** (Top Rated / Random Wheel / Weighted Wheel), **History**.
- Movie data and images come only from TMDB, called from the backend. Only the first page of search results is shown (paging deliberately deferred).
- **UI copy is English only**; no translation is planned.
- Optional future extras (not committed): where to watch in CZ, a veto per spin, mood mode, forgotten-gems nudge (`docs/roadmap.md`).

## Brand Commitments

- Name: **Movie Night**.
- Voice: **playful and warm**, a little jokey ("N movies in the hat", "Not tonight", "We're watching this!", "Everything is out for tonight"). Keep it short and friendly, never corporate.
- Default people: Fuf 🐻 and Cookie 🍪.
- TMDB attribution must stay: "This product uses the TMDB API but is not endorsed or certified by TMDB." (README Credits).
- MIT license, © 2026 Silver-codes.

## Evidence on Hand

- Real content is the TMDB catalog (posters, backdrops, titles, runtimes, genres) fetched live.
- The database holds no real personal history yet; the user hasn't tested with their own movies. Don't invent sample watch history, stats or quotes as if they were real.
- No logo or brand assets beyond the app's favicon.

## Product Principles

1. **The pick comes first.** Movie night in front of a shared screen is the moment the product exists for; everything else feeds or follows it.
2. **Fair and neutral.** Both people have equal weight and equal power to edit; the server chooses, and only pickable movies take part.
3. **Two people, not users.** Names, emoji and colors belong to the couple and stay customizable; no account, sharing or social layer.
4. **Low effort, high fun.** Adding and rating takes a tap or two; playful moments (wheel, confetti, sound) celebrate the decision without slowing it down.

## Accessibility & Inclusion

No specific standard was required. The current baseline (keyboard-operable star ratings and dialogs, focus trapping and restore, reduced-motion handling on the wheel and confetti, an aria-live wheel result, alt text and poster fallbacks) is existing behavior that future work shouldn't regress.
