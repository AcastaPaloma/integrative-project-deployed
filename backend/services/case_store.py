from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

import aiosqlite


@dataclass
class CaseRecord:
    id: str
    label: str
    notes: str
    status: str
    modalities: list[str]
    model_used: str | None
    created_at: str
    updated_at: str
    inference_duration_seconds: float | None


class CaseStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path

    async def list_cases(self) -> list[dict[str, Any]]:
        query = """
            SELECT id, label, notes, status, modalities_json, model_used, created_at, updated_at, inference_duration_seconds
            FROM cases
            ORDER BY created_at DESC
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(query)
            rows = await cursor.fetchall()
        return [self._row_to_dict(row) for row in rows]

    async def get_case(self, case_id: str) -> dict[str, Any] | None:
        query = """
            SELECT id, label, notes, status, modalities_json, model_used, created_at, updated_at, inference_duration_seconds
            FROM cases WHERE id = ?
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(query, (case_id,))
            row = await cursor.fetchone()
        return self._row_to_dict(row) if row else None

    async def create_case(self, label: str, notes: str = "", modalities: list[str] | None = None) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        case_id = str(uuid4())
        modalities = modalities or []
        query = """
            INSERT INTO cases (id, label, notes, status, modalities_json, model_used, created_at, updated_at, inference_duration_seconds)
            VALUES (?, ?, ?, 'ready', ?, NULL, ?, ?, NULL)
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(query, (case_id, label, notes, json.dumps(modalities), now, now))
            await db.commit()
        case = await self.get_case(case_id)
        if case is None:
            raise RuntimeError("Failed to create case")
        return case

    async def update_case(self, case_id: str, label: str | None = None, notes: str | None = None) -> dict[str, Any] | None:
        existing = await self.get_case(case_id)
        if not existing:
            return None
        now = datetime.now(timezone.utc).isoformat()
        next_label = label if label is not None else existing["label"]
        next_notes = notes if notes is not None else existing["notes"]
        query = """
            UPDATE cases
            SET label = ?, notes = ?, updated_at = ?
            WHERE id = ?
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(query, (next_label, next_notes, now, case_id))
            await db.commit()
        return await self.get_case(case_id)

    async def set_status(self, case_id: str, status: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?", (status, now, case_id))
            await db.commit()

    async def set_job(self, case_id: str, model_used: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE cases SET model_used = ?, status = 'queued', updated_at = ? WHERE id = ?",
                (model_used, now, case_id),
            )
            await db.commit()

    async def set_duration(self, case_id: str, seconds: float) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE cases SET inference_duration_seconds = ?, updated_at = ? WHERE id = ?",
                (seconds, now, case_id),
            )
            await db.commit()

    async def set_modalities(self, case_id: str, modalities: list[str]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        payload = json.dumps(sorted(list(set(modalities))))
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE cases SET modalities_json = ?, updated_at = ? WHERE id = ?",
                (payload, now, case_id),
            )
            await db.commit()

    async def delete_case(self, case_id: str) -> bool:
        query = "DELETE FROM cases WHERE id = ?"
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(query, (case_id,))
            await db.commit()
            return cursor.rowcount > 0

    @staticmethod
    def _row_to_dict(row: aiosqlite.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "label": row["label"],
            "notes": row["notes"],
            "status": row["status"],
            "modalities": json.loads(row["modalities_json"]),
            "model_used": row["model_used"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "inference_duration_seconds": row["inference_duration_seconds"],
        }
