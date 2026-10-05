import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

# Built by `npm run build` in frontend/. Only served when it exists (production mode).
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def mount_frontend(app: FastAPI, dist: Path) -> None:
    """Serve the built SPA: hashed assets, other root files, and index.html for client routes.

    Must be called after the API router is included, so the catch-all never shadows /api.
    """
    # The Windows registry can map .js to text/plain, which browsers refuse for module scripts.
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("text/css", ".css")

    dist = dist.resolve()
    index = dist / "index.html"
    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> Response:
        if path == "api" or path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        file = (dist / path).resolve()
        if path and file.is_file() and file.is_relative_to(dist):
            return FileResponse(file)
        # Client-side route (e.g. /watchlist?movie=3): always fetch a fresh index.html.
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
