# Roadmap

The user's planned prompts for upcoming steps. If the user says "do the next step" (or names a step), the prompt for it below is the task, together with its open points at the bottom. If the user sends their own prompt for a step, that wins; update this file to match. Don't implement steps ahead of time.

Steps 1–4 (scaffold, models, TMDB/search, movie CRUD + tests) are done; see Status in `CLAUDE.md`.

## Step 5 — Picking and history (backend)

> Add picking and history:
> - POST /api/pick {method: "top_rated" | "wheel_random" | "wheel_weighted", max_runtime?, genre?}
>   - Candidates: watchlist movies matching the optional filters. Return 400 if there are none.
>   - top_rated: highest hype_total wins, with ties broken randomly.
>   - wheel_random: uniform random choice.
>   - wheel_weighted: random choice with weight = hype_total, where unrated movies (hype_total 0) get weight 1.
>   - Save a Pick (confirmed=false) and return: the pick id, the winning movie, and the full ordered candidate list with each movie's weight and probability, so the frontend can draw the wheel and animate it to land on the winner.
> - POST /api/picks/{id}/confirm: marks the pick confirmed ("we're watching this").
> - GET /api/history: watched movies, newest first, with both verdicts and notes, the average verdict, and the confirmed pick method if one exists. Include stats: total watched, total hours watched, top genre, highest-rated movie by average verdict, and fun ones like "Fuf vs Cookie: average stars given" and "biggest disagreement" (largest verdict difference).
>
> Write tests for all three pick methods: weighted probabilities are correct, ties are random, unrated movies get weight 1, filters work, and an empty watchlist returns an error. Use a seeded random source so tests are deterministic. Run them and fix failures.

The user commits after this step; the backend is then complete and can be explored at `localhost:8000/docs`.

## Step 6 — Frontend shell and design

> Read the frontend-design guidance if available. Now design the frontend look. I want it to feel like a cozy, premium cinema app: dark theme (near-black with a subtle warm tint), one accent color (e.g., marquee gold or popcorn red), a nice display font from Google Fonts for headings, and a clean sans for body. Posters are the hero of the UI.
> Fuf and Cookie each get a signature color and a small avatar or emoji, used consistently wherever their stars appear, so you can see at a glance whose rating is whose.
> Set up: Tailwind theme tokens, React Router with pages (Search, Watchlist, Pick, History), a top nav or bottom tab bar on mobile, TanStack Query for data fetching, a typed API client in src/api.ts matching the backend schemas, a toast system, and skeleton loaders. Keep components in src/components and pages in src/pages. Build just the shell with placeholder pages for now.

## Step 7 — Search and Watchlist pages

> Build the Search and Watchlist pages:
> - A reusable StarRating component (1-5, tap to set, tap the same star again to clear) shown in the person's color with their avatar. Also a compact read-only version for cards.
> - Search: a large search bar with debounced input (300ms) showing a responsive grid of poster cards (year, TMDB rating badge). "Add to watchlist" opens a small quick-rate popover with Fuf's and Cookie's stars, both optional, with "Save" and "Skip rating" buttons. Saved movies show a checkmark. Include empty and error states.
> - Watchlist: a poster grid where each card shows both people's stars and the total. Add filters (genre chips, "not yet rated by Fuf" / "not yet rated by Cookie") and sorting (hype total, recently added, runtime). Clicking a card opens a detail drawer with the backdrop image, overview, runtime, genres, editable stars for both people, and actions (mark watched, remove).
>
> Ratings save instantly with optimistic updates. Add subtle Framer Motion hover animations. Make it fully responsive. We'll use it on a phone too.

## Step 8 — Pick page

> Build the Pick page, the fun centerpiece:
> 1. Method selector with three big cards: "Top Rated", "Random Wheel", "Weighted Wheel". Add optional filters: max runtime (e.g. "under 2h") and genre.
> 2. Top Rated: show a ranked podium/list of the top movies by hype total with both people's stars, highlight #1 with a reveal animation, and offer a "Pick this" button.
> 3. Wheels: call POST /api/pick, then draw an SVG wheel from the returned candidates. In the weighted mode, slice sizes are proportional to the probabilities and show a small percentage. Spin with nice easing (Framer Motion) so the wheel lands exactly on the winner the backend returned. Add a ticking sound if easy, and fire confetti (canvas-confetti) at the end.
> 4. Winner screen: big backdrop, title, runtime, both people's hype stars, and two buttons, "We're watching this!" (calls confirm) and "Spin again".
> 5. After confirming, show a gentle reminder on the movie's detail drawer and the Pick page to "Rate it after watching".

## Step 9 — After-watching flow and History page

> Build the after-watching flow and History page:
> - "Mark as watched" opens a modal with a date (default today) and, side by side, Fuf's and Cookie's verdict stars plus an optional short note each. Either can be left empty and filled in later from the detail drawer.
> - History page: a timeline of watched movies, newest first, with poster, date, how it was picked (badge: Top Rated / Wheel / Weighted Wheel), both verdicts in each person's color, the average, and expandable notes.
> - A stats strip at the top: movies watched, hours watched, top genre, highest rated, "Fuf vs Cookie" average stars, and "biggest disagreement". Also show a small "hype vs reality" indicator per movie (hype stars compared with verdict stars).

## Step 10 — Polish and QA

> Do a full polish and QA pass:
> - Review every page on mobile (375px) and desktop widths and fix any layout issues.
> - Make sure loading, empty, and error states are consistent everywhere (e.g. the Pick page with an empty watchlist).
> - Add keyboard accessibility and focus states, alt text on posters, and a fallback image for missing posters.
> - Check that the wheel always lands on the backend's winner, including with 1, 2 and 30+ candidates (long titles should truncate nicely).
> - Check for console errors, TypeScript errors (run tsc), and lint issues, and fix them.
> - Run the backend tests again.
>
> List anything you think still feels unpolished and suggest improvements, but don't implement big new features.

## Step 11 — Day-to-day running

> Make it easy to run day-to-day: add a single command (a Makefile or a root package.json script using concurrently) that starts both backend and frontend. Also add a production mode where FastAPI serves the built frontend from /frontend/dist, so I can run one process and open it on my phone over the local network. Document it in the README, including how to back up the SQLite file.

## Extras (maybe, after step 11)

- "Where to watch" button: uses TMDB's watch providers for CZ.
- Veto: each person gets one veto per spin.
- "Mood mode": filters by genre with one tap before spinning.
- "Forgotten gems" nudge: highlights movies sitting unrated in the watchlist for over a month.

## Open points to settle when the step comes up

- **Step 5:** pick candidates should use `Movie.pickable_filter()`, so movies skipped tonight are excluded too (the domain rule in CLAUDE.md). Picks are now chosen server-side, so `PickCreate` (client sends `movie_id`) is likely replaced by a pick request body. Paths mix `/api/pick` and `/api/picks/{id}`. Decide whether "average stars given" counts verdicts only or hype too.
- **Step 8 depends on step 5:** the "Rate it after watching" reminder needs to know a movie has a confirmed pick and isn't watched yet. Expose that on the movie response in step 5 (e.g. a confirmed-pick field on `MovieRead`).
- **Step 6 vs conventions (decided):** keep the `src/api/` folder, one file per resource, not the single `src/api.ts` from the prompt. Also add `src/pages/` to the folder structure.
- **Skip tonight UI (agreed):** the backend supports it (`skipped_tonight` in PATCH), but no frontend step mentions it. Add it in the detail drawer (step 7) and/or the Pick page (step 8).
- **Step 5 "average stars given":** verdicts only, or hype too? Ask the user when step 5 starts.
- **Step 9:** "date default today" should match the backend, which uses the movie-night date (it rolls over at 06:00), so the frontend can just omit `watched_on`.
- **Step 11 vs conventions:** serving `frontend/dist` from FastAPI is an intended exception to "never mount routes outside `/api`". Mount static files plus an SPA fallback, without shadowing `/api`.
