# Movie Night

Small personal web app used by exactly two people, **Fuf** and **Cookie**, on one shared device. They save movies from TMDB, each give them 1–5 stars, and pick what to watch by top rating or a spinning wheel.

## Key domain rules

- The two people are fixed: **Fuf** and **Cookie**. They are not users or accounts — model them as a fixed value (e.g. an enum), not a table with sign-up.
- No accounts, no logins, no auth, no permissions. Either person can edit everything (including the other person's ratings).
- Ratings are integers 1–5, one per person per movie (a movie may be unrated by one or both).

## Status

Update this section at the end of each step so work can resume after `/clear`.

- [x] Scaffold: monorepo, `/api/health`, frontend page that shows the health result.
- [ ] Next: no features built yet (no DB models, no TMDB calls, no ratings, no picker).

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
    main.py           # FastAPI app, lifespan (creates tables), mounts api_router at /api
    config.py         # Settings (pydantic-settings), get_settings()
    db.py             # SQLite engine, create_db_and_tables(), get_session dependency
    api/
      __init__.py     # api_router — include each feature router here
      health.py       # GET /api/health
frontend/
  vite.config.ts      # React + Tailwind plugins, /api proxy -> http://localhost:8000
  src/
    main.tsx, App.tsx, index.css
    api/              # typed fetch functions, one file per resource
    components/       # small focused components
```

## Conventions

- **Typed code everywhere.** Python: type hints on all functions, Pydantic/SQLModel models for request/response bodies. TypeScript: strict mode, no `any`; mirror backend response shapes as TS types in `src/api/`.
- **All API routes live under `/api`.** Add a router module in `backend/app/api/`, include it in `api_router`; never mount routes outside the `/api` prefix.
- **Small, focused components.** One component per file in `src/components/`; keep data fetching in `src/api/` functions, not inline `fetch` calls in components.
- Styling with Tailwind utility classes only (no separate CSS files per component).
- Config/secrets only via `Settings` in `app/config.py` and `.env`; never hardcode tokens or return them from the API.
- The frontend always calls relative `/api/...` URLs (the Vite proxy handles routing in dev).

## Running

```bash
# Backend (port 8000)
cd backend && uv sync && uv run fastapi dev app/main.py

# Frontend (port 5173)
cd frontend && npm install && npm run dev

# Frontend type-check + build / lint
cd frontend && npm run build
cd frontend && npm run lint

# Add a backend dependency
cd backend && uv add <package>
```
