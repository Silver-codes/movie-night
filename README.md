# Movie Night

A small personal web app for Fuf and Cookie: save movies from TMDB, rate them 1–5 stars each, and pick what to watch by top rating or a spinning wheel.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 automatically if needed)
- Node.js 20+ and npm

## Backend (FastAPI) — http://localhost:8000

```bash
cd backend
cp .env.example .env      # then put your TMDB read access token in .env
uv sync
uv run fastapi dev app/main.py
```

- Health check: http://localhost:8000/api/health
- Interactive API docs: http://localhost:8000/docs

## Frontend (React + Vite) — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to the backend on port 8000, so start the backend first.

Other frontend commands: `npm run build` (type-check + production build), `npm run lint`.
