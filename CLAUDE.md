# Movie Night

Small personal web app used by exactly two people (by default **Fuf** and **Cookie**, renamable in the app) on one shared device. They save movies from TMDB, each give them 1–5 stars, and pick what to watch by top rating or a spinning wheel.

## Key domain rules

- There are always exactly two person **slots**, `PEOPLE = ["fuf", "cookie"]` in `app/models.py`, with per-person columns (`fuf_*`, `cookie_*`). They are not users or accounts. `fuf`/`cookie` are internal IDs only: what people see (name, emoji, color from a curated palette) is their `PersonProfile` row (`GET /api/people`, `PATCH /api/people/{person}`, seeded with Fuf 🐻 / Cookie 🍪 on startup). Never hardcode the display names in the UI.
- No accounts, no logins, no auth, no permissions. Either person can edit everything (including the other person's ratings).
- Stars are integers 1–5 or null, per person per movie: **hype** (`*_hype`, before watching, drives picking; `hype_total` = sum with nulls as 0) and **verdict** (`*_verdict`, after watching) plus an optional `*_note`.
- **Pickable** = `status == watchlist` and not skipped tonight. Every pick method (top rated and both wheels) must use only pickable movies: `is_pickable()` / `Movie.pickable_filter()` in `app/models.py`. The server chooses the winner (`POST /api/picks` with a `PickRequest`); clients never send a `movie_id` to pick. The one exception is confirming on Top Rated: `POST /api/picks/{id}/confirm` may name another candidate of that pick (`PickConfirm.movie_id`, checked against `PendingPick.choosable_ids`); a wheel's confirm only accepts its winner.
- **Skip tonight**: either person can say "not tonight" (`MovieUpdate.skipped_tonight`). It's stored as `skipped_on` = the movie-night date (local time, rolls over at 06:00) and expires on its own the next night. Apply PATCHes with `Movie.apply_update()`.

## Status

All roadmap steps (1–11) and the Pick page passes are done. What each step built, file by file, is in `docs/changelog.md`; read the relevant entry before changing a feature. At the end of each step, add an entry there and update **Next** below, so work can resume after `/clear`.

### Gotchas

- **The DB:** no migrations. `backend/movie_night.db` holds no real data, but it's the user's manual-testing set (saved movies, hype), so don't delete it: after a schema change, ask how to migrate it.
- **Picks are saved only on confirm:** `POST /api/picks` keeps a pending pick in memory (`PendingPicks` in `picks.py`, `pick_id` is a string token), so a confirm after a backend restart is a 404 "expired".
- **Movie-night date:** `movieNightDate()` in `frontend/src/lib/format.ts` mirrors the backend's `movie_night_date()` (rolls over at 06:00); change both together.
- **Production mode:** `mount_frontend()` (`app/frontend.py`) runs only when `frontend/dist/index.html` exists, after `api_router`; it forces the `.js`/`.css` MIME types because the Windows registry can get them wrong.
- **Person colors:** `applyPersonColors()` (`lib/personProfiles.ts`) points `--color-fuf` / `--color-cookie` at the chosen `--color-swatch-*`; the `-soft` tints follow via `color-mix`.
- **Motion:** don't use `whileTap` on non-buttons: it adds `tabindex=0` (use CSS `active:scale-*`).
- **Optimistic updates:** callbacks after a `useUpdateMovie` that unmounts the caller go in `mutateAsync().then(...)`, not per-call `onSuccess` (skipped on unmount).
- **`Modal`** renders through a portal on `<body>` (fixed positioning breaks inside transformed ancestors).
- **Design context** for the impeccable skill: `PRODUCT.md`, `DESIGN.md` + `.impeccable/design.json` ("Lights Down, Screen Up", One Light Source rule); critique snapshots in `.impeccable/critique/`.

### Next

- [ ] **Next: `/impeccable critique pick`** (critique #5). The plan agreed after critique #4 is done: adapt (phone respin), polish, harden (take back a confirmed pick), delight ("Lights down"), final polish, plus Top Rated "choose any place" and the drawer double-click fix. Pick score history: 27 → 27 → 25 → 29/40 (#4, snapshot `.impeccable/critique/2026-10-11T21-04-39Z__…`). Compare against #4.
  - **Decisions to respect in the critique and after it:** the winner's label on the wheel stays vertical (the card shows the name); the choose-stage redesign ("open straight on the wheel" / choose stage as a ritual) is saved for a later `/impeccable shape pick`; Top Rated lets them take any place, and "Not tonight" acts on the chosen movie; wheels stay the server's result.
  - **Testing anything that writes (confirm, cancel, "Didn't watch it"):** never against `backend/movie_night.db` (not real data, but it's their manual-testing set; keep it intact). Copy it, run `uv run uvicorn app.main:app --port 8010` with `DATABASE_URL=sqlite:///<copy>`, and point Vite at :8010 with a throwaway config outside the repo (`.mts`, importing `frontend/vite.config.ts`, `root` = frontend, proxy `/api` → :8010). Their own app may be running on :8000 ("Start Movie Night.bat"); don't stop it.
  - **On a fresh machine:** `backend/.env` (TMDB token) and `backend/movie_night.db` are git-ignored. Copy both over from the other computer (or create `.env` from `.env.example` and add a few movies), then `npm install` and `uv sync` (README). The critique needs real watchlist content: at least 4 movies for the podium's "N more in the hat", some with hype.
  - Later ideas from earlier critiques: center the wheel while it spins, a winner-card fallback without a backdrop. Optional extras in `docs/roadmap.md`.

## Roadmap

Full planned prompts, plus open points to check before each step: `docs/roadmap.md`. Read the relevant section when starting a step. The prompt the user actually sends wins. Don't build ahead.

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
package.json          # root scripts only (concurrently): setup, dev, build, start, serve, test, lint, backup
backups/              # npm run backup output (git-ignored)
backend/
  .env.example        # TMDB_TOKEN=... (copy to .env, never commit .env)
  pyproject.toml      # uv project (not a package; run from backend/)
  app/
    main.py           # FastAPI app, lifespan (creates tables, TMDB client), TMDBError handler, mounts api_router at /api
    config.py         # Settings (pydantic-settings), get_settings()
    db.py             # SQLite engine (FKs on), create_db_and_tables(), get_session dependency
    models.py         # PEOPLE, enums, Movie/Pick/PersonProfile tables + request/response schemas
    tmdb.py           # TMDBClient (httpx async), TMDBError, search cache, get_tmdb dependency
    frontend.py       # mount_frontend(): serves frontend/dist + SPA fallback (production mode only)
    api/
      __init__.py     # api_router — include each feature router here
      health.py       # GET /api/health
      search.py       # GET /api/search?q=, GET /api/tmdb/movies/{tmdb_id}
      movies.py       # /api/movies CRUD + /watched + DELETE /{id}/pick
      picks.py        # POST /api/picks (choose(), get_rng), /api/picks/{id}/confirm
      history.py      # GET /api/history (+ stats)
      people.py       # GET /api/people, PATCH /api/people/{person} (names, emoji, colors), seed_people()
  scripts/
    backup_db.py      # SQLite online backup -> ../backups/ (npm run backup)
  tests/
    conftest.py       # engine/client/tmdb_mock/session/make_movie fixtures
    factories.py      # fake TMDB payloads
    test_*.py         # one per API area (search, movies, picks, history, people) + frontend, performance
frontend/
  vite.config.ts      # React + Tailwind plugins, /api proxy -> http://localhost:8000
  index.html          # preconnect to image.tmdb.org (fonts are self-hosted via @fontsource-variable)
  src/
    main.tsx          # QueryClient (+ mutation error toasts), RouterProvider, Toaster
    router.tsx        # routes: AppLayout > search / watchlist / pick / history (lazy-loaded pages)
    index.css         # Tailwind import + @theme design tokens + base styles
    people.ts         # person slots (class names) + usePeople()/usePersonInfo() for name, emoji, color
    api/              # types.ts (backend schemas), client.ts (apiFetch), queryKeys.ts, images.ts, one file per resource
    lib/              # non-UI helpers (toast.ts store, useDebouncedValue, useMediaQuery, format)
    components/       # small focused components (one per file)
    pages/            # one component per route
```

## Conventions

- **Typed code everywhere.** Python: type hints on all functions, Pydantic/SQLModel models for request/response bodies. TypeScript: strict mode, no `any`; mirror backend response shapes as TS types in `src/api/`.
- **All API routes live under `/api`.** Add a router module in `backend/app/api/`, include it in `api_router`; never mount routes outside the `/api` prefix.
- **Small, focused components.** One component per file in `src/components/`; keep data fetching in `src/api/` functions, not inline `fetch` calls in components.
- Styling with Tailwind utility classes only (no separate CSS files per component). Use the theme tokens (`bg-ink-900`, `text-accent`, `text-fuf`…), not raw hex colors; person colors via `usePersonInfo()`.
- Config/secrets only via `Settings` in `app/config.py` and `.env`; never hardcode tokens or return them from the API.
- The frontend always calls relative `/api/...` URLs (the Vite proxy handles routing in dev).

## Running

```bash
# From the repo root (see README): first-time setup, both dev servers, production on 0.0.0.0:8000, backup
npm run setup
npm run dev
npm start            # = npm run build && npm run serve
npm run backup

# Backend (port 8000)
cd backend && uv sync && uv run fastapi dev app/main.py

# Backend tests (never call the real TMDB)
cd backend && uv run pytest

# Frontend (port 5173)
cd frontend && npm install && npm run dev

# Frontend type-check + build / lint / unit tests (vitest)
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm test

# Headless browser checks: `playwright` (+ Chromium) is a frontend devDependency for ad-hoc
# scripts against the dev servers. For phones use isMobile + a 375px viewport (overflow shows as innerWidth > 375).

# Add a backend dependency
cd backend && uv add <package>
```
