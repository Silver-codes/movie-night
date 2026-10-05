# Movie Night

A small personal web app for Fuf and Cookie: save movies from TMDB, rate them 1–5 stars each, and pick what to watch by top rating or a spinning wheel.

All commands below are run from the **repo root** unless noted.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 automatically if needed)
- Node.js 20+ and npm

## First-time setup

```bash
cp backend/.env.example backend/.env   # then put your TMDB read access token in backend/.env
npm run setup                          # root + frontend npm packages, backend Python packages
```

Check the token loaded: `tmdb_configured` should be `true` at http://localhost:8000/api/health once the backend runs.

## Everyday development

```bash
npm run dev
```

Starts both servers in one terminal (logs prefixed `[api]` / `[web]`; Ctrl+C stops both):

- App with hot reload: http://localhost:5173 (Vite proxies `/api/*` to the backend)
- Backend: http://localhost:8000, interactive API docs at http://localhost:8000/docs

Run them separately if you prefer: `npm run dev:api` and `npm run dev:web`.

## On the phone (production mode)

One process serves both the API and the built frontend, reachable from other devices on your Wi-Fi:

```bash
npm start          # builds the frontend, then serves everything on port 8000
npm run serve      # same, without rebuilding (when the frontend hasn't changed)
```

1. Find the computer's local IP: run `ipconfig` (Windows) and look for the Wi-Fi adapter's **IPv4 Address**, e.g. `192.168.1.23`.
2. On the phone (same Wi-Fi), open `http://192.168.1.23:8000`. Tip: "Add to Home Screen" for one-tap access.
3. The first time, Windows Firewall asks whether to allow Python: allow it on **Private networks** (make sure your home Wi-Fi is set as a private network).

Notes:

- Stop `npm run dev` first; both use port 8000.
- There's no login: anyone on the same network who knows the address can use the app. Fine at home; don't run it on public Wi-Fi.
- Production mode only kicks in when `frontend/dist` exists. Without it the backend just serves the API.

## Backup & restore

Everything (movies, stars, notes, history) lives in one SQLite file: `backend/movie_night.db`. It's git-ignored, so back it up yourself.

```bash
npm run backup
```

Writes a timestamped copy to `backups/` (e.g. `backups/movie_night-2026-10-05_201500.db`). It's safe to run while the app is running. Copy the `backups/` folder somewhere else now and then (cloud drive, USB stick): a backup on the same disk won't survive a dead disk.

To restore:

1. Stop the app.
2. Copy the backup over `backend/movie_night.db` (keep the old file aside if unsure).
3. Start the app again.

## Tests and checks

```bash
npm test           # backend pytest + frontend vitest
npm run lint       # frontend lint
npm run build      # frontend type-check + production build
```

Backend tests never call the real TMDB API.

## Troubleshooting

- **Port 8000 already in use**: another backend is still running (an old `npm run dev` or `npm start`). Close that terminal, or find it with `netstat -ano | findstr :8000`.
- **Search fails / `tmdb_configured: false`**: `backend/.env` is missing or has no `TMDB_TOKEN`. Restart the backend after editing it.
- **Phone can't connect**: check both devices are on the same Wi-Fi, the IP is current (it can change after a router restart), and the firewall rule allows Python on private networks.
