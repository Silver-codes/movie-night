# Movie Night

Small personal web app used by exactly two people, **Fuf** and **Cookie**, on one shared device. They save movies from TMDB, each give them 1–5 stars, and pick what to watch by top rating or a spinning wheel.

## Key domain rules

- The two people are fixed: **Fuf** and **Cookie**. They are not users or accounts — they're the constant `PEOPLE = ["fuf", "cookie"]` in `app/models.py`, with per-person columns (`fuf_*`, `cookie_*`), no user table.
- No accounts, no logins, no auth, no permissions. Either person can edit everything (including the other person's ratings).
- Stars are integers 1–5 or null, per person per movie: **hype** (`*_hype`, before watching, drives picking; `hype_total` = sum with nulls as 0) and **verdict** (`*_verdict`, after watching) plus an optional `*_note`.
- **Pickable** = `status == watchlist` and not skipped tonight. Every pick method (top rated and both wheels) must use only pickable movies: `is_pickable()` / `Movie.pickable_filter()` in `app/models.py`. The server chooses the winner (`POST /api/picks` with a `PickRequest`); clients never send a `movie_id` to pick.
- **Skip tonight**: either person can say "not tonight" (`MovieUpdate.skipped_tonight`). It's stored as `skipped_on` = the movie-night date (local time, rolls over at 06:00) and expires on its own the next night. Apply PATCHes with `Movie.apply_update()`.

## Status

Update this section at the end of each step so work can resume after `/clear`.

- [x] Scaffold: monorepo, `/api/health`, frontend page that shows the health result.
- [x] DB models in `app/models.py`: `Movie`, `Pick` (+ request/response schemas); tables created on startup; SQLite FKs enabled in `db.py`. Pickable rule + "skip tonight" in place. No migrations: after a schema change, delete `backend/movie_night.db` (fine while it's empty).
- [x] TMDB service in `app/tmdb.py`: async `TMDBClient` (created in `lifespan`, injected via `get_tmdb`), `search_movies()` (5-min in-memory cache), `get_movie_details()` returning `TMDBMovieDetails` whose fields match `MovieBase`. Failures raise `TMDBError` → JSON `{"detail"}` via handler in `main.py`. `GET /api/search?q=` returns `SearchResult` list with `already_saved` (computed per request, never cached). Only TMDB page 1 (top 20) is returned; paging deliberately deferred.
- [x] Movie CRUD in `app/api/movies.py`: `POST /api/movies` (`MovieSave` → TMDB details, 409 if saved), `GET /api/movies` (`status`, `genre` via `json_each`, `unrated_by` = missing hype on watchlist / missing verdict when watched, `sort` with nulls last), `GET|PATCH|DELETE /api/movies/{id}`, `POST /api/movies/{id}/watched` (`MovieWatched`, `watched_on` defaults to `movie_night_date()`, only sent verdicts/notes change). PATCH: null clears a star/note, `status: null` → 422, status→watched fills `watched_on`.
- [x] Tests in `backend/tests/` (pytest + respx, in-memory SQLite via monkeypatched `app.db.engine`, settings never read `.env`): search + all movie endpoints.
- [x] Picking + history in `app/api/picks.py` / `app/api/history.py`: `POST /api/picks` (`PickRequest`: method, `max_runtime` excludes unknown runtimes, `genre`; 400 if no pickable match) → `PickResult` with winner + ordered candidates (weight, probability). Choice in pure `choose()` using the `get_rng` dependency (seeded in tests). top_rated: weight = hype_total, random among ties; wheel_random: uniform; wheel_weighted: weight = hype_total or 1. `POST /api/picks/{id}/confirm` (idempotent). `MovieRead.confirmed_pick_method` = latest confirmed pick (for "rate it after watching" when still on watchlist). `GET /api/history` → watched movies newest first with `average_verdict` + stats (verdicts only for "Fuf vs Cookie"; ties → most recent). Backend complete; see `localhost:8000/docs`.
- [x] Frontend shell (step 6): theme tokens in `src/index.css` `@theme` (near-black `ink-*` surfaces with a faint silver glow, `fg`/`muted` text, one accent `accent` (blue), `fuf` lavender / `cookie` rose + `*-soft` tints; fonts Outfit `font-display` for headings, Inter body, loaded in `index.html`). Fuf/Cookie name, emoji (🐻 / 🍪) and color classes only via `src/people.ts` (`PEOPLE`, `personInfo()`), rendered by `PersonAvatar` / `PersonTag`. React Router (`src/router.tsx`, layout `AppLayout` = `TopNav` on md+ / `BottomTabBar` on mobile, `/` → `/watchlist`). TanStack Query client in `main.tsx` (failed mutations → toast; query errors shown inline). Typed API in `src/api/` (`types.ts` mirrors backend schemas, `client.ts` `apiFetch`/`ApiError`/`withQuery`, one file per resource, `images.ts` TMDB image URLs from paths, `queryKeys.ts`). Toasts: own store `src/lib/toast.ts` (`toast.success/error/info`) + `Toaster`. Skeletons: `Skeleton`, `PosterGridSkeleton`. Pages in `src/pages/` are placeholders.
- [x] Search + Watchlist (step 7): `motion` (Framer Motion, import from `motion/react`) for hover/layout/drawer animations. Query/mutation hooks in `src/api/movieHooks.ts` (`useMovies`, `useMovie`, optimistic `useUpdateMovie` patching every cached list + detail with rollback, `useSaveMovie` flips `already_saved` in search caches, `useDeleteMovie`, `useMarkWatched`) and `src/api/searchHooks.ts` (`useSearch`). Components: `StarRating` (tap again clears; mouse hover on the current star previews the clear with a ×; radiogroup + arrow keys, sizes xs/sm/md), `StarDisplay` (read-only), `PosterImage` (fallback), `RatingBadge`, `SearchBar`, `SearchResultCard` + `QuickRatePopover` (overlays the poster), `WatchlistCard`, `WatchlistFilters` + `FilterChip`, generic `Drawer` (bottom sheet on phones, right panel md+) + `MovieDetails` (hype stars, "Not tonight" switch, Mark watched, Remove with second tap). Grid columns shared via `components/posterGrid.ts`. Search keeps `?q=`; Watchlist keeps `genre`/`unrated`/`sort`/`movie` in the URL (back closes the drawer); filtering/sorting is server-side. "Mark watched" currently posts with no verdicts (step 9 replaces it with the modal). Helpers in `src/lib/`: `useDebouncedValue`, `useMediaQuery`, `format.ts`.
- [ ] Next: step 8, Pick page.

## Roadmap

Full planned prompts, plus open points to check before each step: `docs/roadmap.md`. Read the relevant section when starting a step. The prompt the user actually sends wins. Don't build ahead.

5. ~~Backend: `POST /api/picks` (top_rated / wheel_random / wheel_weighted, server-side choice, returns candidates with weights), confirm a pick, `GET /api/history` with stats.~~ Done.
6. ~~Frontend shell: cozy dark cinema theme, per-person color and avatar, router (Search / Watchlist / Pick / History), TanStack Query, toasts, skeletons.~~ Done.
7. ~~Search and Watchlist pages: StarRating, quick-rate popover, filters/sort, detail drawer, optimistic updates.~~ Done.
8. Pick page: method cards, top-rated podium, SVG wheel landing on the backend's winner, confetti, confirm.
9. Mark-watched modal and History page with stats.
10. Polish/QA pass (mobile, a11y, states, tsc/lint, tests).
11. One-command dev run, production mode (FastAPI serves `frontend/dist`) for phone on LAN, README + DB backup.
- Extras (maybe): where to watch (CZ), veto per spin, mood mode, forgotten gems.

## Workflow

- Do **not** run `git commit` (or push); the user commits themselves.
- Never ask for or handle the TMDB token in chat. It lives only in `backend/.env`, and `/api/health` → `tmdb_configured` shows whether it loaded.

## Stack

- **Backend** (`backend/`): Python 3.12, FastAPI, SQLModel, SQLite, pydantic-settings, managed with **uv**.
- **Frontend** (`frontend/`): React, Vite, TypeScript (strict), Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config`).
- **External**: TMDB API, called **only from the backend** using `TMDB_TOKEN`.

## Folder structure

```
backend/
  .env.example        # TMDB_TOKEN=... (copy to .env, never commit .env)
  pyproject.toml      # uv project (not a package; run from backend/)
  app/
    main.py           # FastAPI app, lifespan (creates tables, TMDB client), TMDBError handler, mounts api_router at /api
    config.py         # Settings (pydantic-settings), get_settings()
    db.py             # SQLite engine (FKs on), create_db_and_tables(), get_session dependency
    models.py         # PEOPLE, enums, Movie/Pick tables + request/response schemas
    tmdb.py           # TMDBClient (httpx async), TMDBError, search cache, get_tmdb dependency
    api/
      __init__.py     # api_router — include each feature router here
      health.py       # GET /api/health
      search.py       # GET /api/search?q=
      movies.py       # /api/movies CRUD + /watched
      picks.py        # POST /api/picks (choose(), get_rng), /api/picks/{id}/confirm
      history.py      # GET /api/history (+ stats)
  tests/
    conftest.py       # engine/client/tmdb_mock/session/make_movie fixtures
    factories.py      # fake TMDB payloads
    test_search.py, test_movies.py, test_picks.py, test_history.py
frontend/
  vite.config.ts      # React + Tailwind plugins, /api proxy -> http://localhost:8000
  index.html          # Google Fonts (Outfit, Inter)
  src/
    main.tsx          # QueryClient (+ mutation error toasts), RouterProvider, Toaster
    router.tsx        # routes: AppLayout > search / watchlist / pick / history
    index.css         # Tailwind import + @theme design tokens + base styles
    people.ts         # Fuf/Cookie name, emoji, color classes
    api/              # types.ts (backend schemas), client.ts (apiFetch), queryKeys.ts, images.ts, one file per resource
    lib/              # non-UI helpers (toast.ts store, useDebouncedValue, useMediaQuery, format)
    components/       # small focused components (one per file)
    pages/            # one component per route
```

## Conventions

- **Typed code everywhere.** Python: type hints on all functions, Pydantic/SQLModel models for request/response bodies. TypeScript: strict mode, no `any`; mirror backend response shapes as TS types in `src/api/`.
- **All API routes live under `/api`.** Add a router module in `backend/app/api/`, include it in `api_router`; never mount routes outside the `/api` prefix.
- **Small, focused components.** One component per file in `src/components/`; keep data fetching in `src/api/` functions, not inline `fetch` calls in components.
- Styling with Tailwind utility classes only (no separate CSS files per component). Use the theme tokens (`bg-ink-900`, `text-accent`, `text-fuf`…), not raw hex colors; person colors via `personInfo()`.
- Config/secrets only via `Settings` in `app/config.py` and `.env`; never hardcode tokens or return them from the API.
- The frontend always calls relative `/api/...` URLs (the Vite proxy handles routing in dev).

## Running

```bash
# Backend (port 8000)
cd backend && uv sync && uv run fastapi dev app/main.py

# Backend tests (never call the real TMDB)
cd backend && uv run pytest

# Frontend (port 5173)
cd frontend && npm install && npm run dev

# Frontend type-check + build / lint
cd frontend && npm run build
cd frontend && npm run lint

# Add a backend dependency
cd backend && uv add <package>
```
