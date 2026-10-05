"""Copy the SQLite database to backups/ at the repo root.

Run from backend/: `uv run python -m scripts.backup_db` (or `npm run backup` from the repo root).
Uses SQLite's online backup, so the copy is consistent even while the server is running.
"""

import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import make_url

from app.config import get_settings

BACKUP_DIR = Path(__file__).resolve().parents[2] / "backups"


def backup_database(db_path: Path, backup_dir: Path) -> Path:
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / f"{db_path.stem}-{datetime.now():%Y-%m-%d_%H%M%S}.db"
    # Open read-only via URI so a missing file errors instead of creating an empty database.
    with sqlite3.connect(f"{db_path.resolve().as_uri()}?mode=ro", uri=True) as source:
        with sqlite3.connect(target) as dest:
            source.backup(dest)
    return target


def main() -> int:
    database = make_url(get_settings().database_url).database
    if not database:
        print("DATABASE_URL has no file path (in-memory database?).", file=sys.stderr)
        return 1
    db_path = Path(database)
    if not db_path.is_file():
        print(f"No database at {db_path.resolve()} yet: nothing to back up.", file=sys.stderr)
        return 1
    print(f"Backed up to {backup_database(db_path, BACKUP_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
