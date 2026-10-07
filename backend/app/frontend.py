import mimetypes
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.types import Scope

# Built by `npm run build` in frontend/. Only served when it exists (production mode).
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


class ImmutableStaticFiles(StaticFiles):
    """Vite's /assets file names contain a content hash, so browsers may cache them forever."""

    def file_response(
        self,
        full_path: str | os.PathLike[str],
        stat_result: os.stat_result,
        scope: Scope,
        status_code: int = 200,
    ) -> Response:
        response = super().file_response(full_path, stat_result, scope, status_code)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


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
        app.mount("/assets", ImmutableStaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> Response:
        if path == "api" or path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        file = (dist / path).resolve()
        if path and file.is_file() and file.is_relative_to(dist):
            return FileResponse(file)
        # Client-side route (e.g. /watchlist?movie=3): always fetch a fresh index.html.
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
