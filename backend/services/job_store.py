from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class JobStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path

    async def create_job(self, case_id: str, model_id: str, profile: str, selected_modalities: list[str]) -> dict[str, Any]:
        job_id = str(uuid4())
        created_at = _now()
        query = """
            INSERT INTO jobs (
                id, case_id, status, model_id, profile, selected_modalities_json,
                queue_position, created_at, started_at, completed_at, error_message
            ) VALUES (?, ?, 'queued', ?, ?, ?, NULL, ?, NULL, NULL, NULL)
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(query, (job_id, case_id, model_id, profile, json.dumps(selected_modalities), created_at))
            await db.commit()
        return await self.get_job(job_id)

    async def get_job(self, job_id: str) -> dict[str, Any] | None:
        query = """
            SELECT id, case_id, status, model_id, profile, selected_modalities_json,
                   queue_position, created_at, started_at, completed_at, error_message
            FROM jobs WHERE id = ?
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(query, (job_id,))
            row = await cur.fetchone()
        return self._row_to_dict(row) if row else None

    async def list_jobs(self) -> list[dict[str, Any]]:
        query = """
            SELECT id, case_id, status, model_id, profile, selected_modalities_json,
                   queue_position, created_at, started_at, completed_at, error_message
            FROM jobs ORDER BY created_at DESC
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(query)
            rows = await cur.fetchall()
        return [self._row_to_dict(r) for r in rows]

    async def update_status(self, job_id: str, status: str, error_message: str | None = None) -> None:
        started_at = _now() if status == "running" else None
        completed_at = _now() if status in {"completed", "failed", "cancelled"} else None
        async with aiosqlite.connect(self.db_path) as db:
            if status == "running":
                await db.execute(
                    "UPDATE jobs SET status = ?, started_at = ?, error_message = NULL WHERE id = ?",
                    (status, started_at, job_id),
                )
            elif completed_at:
                await db.execute(
                    "UPDATE jobs SET status = ?, completed_at = ?, error_message = ? WHERE id = ?",
                    (status, completed_at, error_message, job_id),
                )
            else:
                await db.execute(
                    "UPDATE jobs SET status = ?, error_message = ? WHERE id = ?",
                    (status, error_message, job_id),
                )
            await db.commit()

    async def set_queue_position(self, job_id: str, position: int | None) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE jobs SET queue_position = ? WHERE id = ?", (position, job_id))
            await db.commit()

    async def append_log_line(self, job_id: str, line_number: int, content: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT INTO log_lines (job_id, line_number, content, created_at) VALUES (?, ?, ?, ?)",
                (job_id, line_number, content, _now()),
            )
            await db.commit()

    async def get_log_lines(self, job_id: str, after_line: int = 0) -> list[dict[str, Any]]:
        query = """
            SELECT line_number, content, created_at
            FROM log_lines
            WHERE job_id = ? AND line_number > ?
            ORDER BY line_number ASC
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(query, (job_id, after_line))
            rows = await cur.fetchall()
        return [
            {"line_number": row["line_number"], "content": row["content"], "created_at": row["created_at"]}
            for row in rows
        ]

    def _row_to_dict(self, row: aiosqlite.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "case_id": row["case_id"],
            "status": row["status"],
            "model_id": row["model_id"],
            "profile": row["profile"],
            "selected_modalities": json.loads(row["selected_modalities_json"] or "[]"),
            "queue_position": row["queue_position"],
            "created_at": row["created_at"],
            "started_at": row["started_at"],
            "completed_at": row["completed_at"],
            "error_message": row["error_message"],
        }
