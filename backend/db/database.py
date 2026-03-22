from pathlib import Path
import aiosqlite


async def init_db(db_path: Path, schema_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    schema = schema_path.read_text(encoding="utf-8")
    async with aiosqlite.connect(db_path) as db:
        await db.executescript(schema)
        await _run_migrations(db)
        await db.commit()


async def _run_migrations(db: aiosqlite.Connection) -> None:
    await _ensure_column(db, "jobs", "selected_modalities_json", "TEXT DEFAULT '[]'")
    await _ensure_column(db, "jobs", "queue_position", "INTEGER")


async def _ensure_column(db: aiosqlite.Connection, table: str, column: str, definition: str) -> None:
    cursor = await db.execute(f"PRAGMA table_info({table})")
    rows = await cursor.fetchall()
    existing_columns = {row[1] for row in rows}
    if column not in existing_columns:
        await db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
