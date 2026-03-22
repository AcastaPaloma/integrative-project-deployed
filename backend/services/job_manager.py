from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from services.case_store import CaseStore
from services.file_manager import FileManager
from services.inference_runner import run_case_inference
from services.job_store import JobStore


class JobManager:
    def __init__(
        self,
        *,
        db_path: Path,
        data_dir: Path,
        source_repo_root: Path,
        checkpoints_dir: Path,
    ):
        self._db_path = db_path
        self._data_dir = data_dir
        self._source_repo_root = source_repo_root
        self._checkpoints_dir = checkpoints_dir

        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None
        self._stopping = False
        self._line_counters: dict[str, int] = {}

        self.job_store = JobStore(db_path)
        self.case_store = CaseStore(db_path)
        self.file_manager = FileManager(data_dir)

    async def start(self) -> None:
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker_loop())

    async def stop(self) -> None:
        self._stopping = True
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None

    async def enqueue_job(self, case_id: str, model_id: str, profile: str, selected_modalities: list[str]) -> dict[str, Any]:
        job = await self.job_store.create_job(case_id, model_id, profile, selected_modalities)
        await self.case_store.set_job(case_id, model_id)
        await self._queue.put(job["id"])
        await self._refresh_queue_positions()
        return await self.job_store.get_job(job["id"])

    async def cancel_job(self, job_id: str) -> bool:
        job = await self.job_store.get_job(job_id)
        if not job or job["status"] != "queued":
            return False
        await self.job_store.update_status(job_id, "cancelled")
        await self._refresh_queue_positions()
        return True

    async def get_job(self, job_id: str) -> dict[str, Any] | None:
        return await self.job_store.get_job(job_id)

    async def list_jobs(self) -> list[dict[str, Any]]:
        return await self.job_store.list_jobs()

    async def _worker_loop(self) -> None:
        while not self._stopping:
            job_id = await self._queue.get()
            job = await self.job_store.get_job(job_id)
            if not job or job["status"] != "queued":
                self._queue.task_done()
                await self._refresh_queue_positions()
                continue

            await self.job_store.update_status(job_id, "running")
            await self._refresh_queue_positions()

            case = await self.case_store.get_case(job["case_id"])
            if not case:
                await self.job_store.update_status(job_id, "failed", "Case not found")
                self._queue.task_done()
                continue

            await self.case_store.set_status(case["id"], "running")

            try:
                await self._execute_job(job)
                await self.job_store.update_status(job_id, "completed")
                await self.case_store.set_status(case["id"], "completed")
            except (RuntimeError, ValueError, FileNotFoundError, OSError) as exc:
                await self._append_log(job_id, f"[ERROR] {exc}")
                await self.job_store.update_status(job_id, "failed", str(exc))
                await self.case_store.set_status(case["id"], "failed")

            self._queue.task_done()

    async def _execute_job(self, job: dict[str, Any]) -> None:
        case = await self.case_store.get_case(job["case_id"])
        if not case:
            raise RuntimeError("Case not found")

        case_dir = self.file_manager.ensure_case_dirs(case["id"])
        inputs = self.file_manager.list_input_files(case["id"])
        outputs = case_dir / "outputs"
        loop = asyncio.get_running_loop()

        checkpoint = self._checkpoints_dir / job["model_id"] / "best_model.pth"
        if not checkpoint.exists():
            checkpoint = self._checkpoints_dir / job["model_id"] / "last_model.pth"
        if not checkpoint.exists():
            raise RuntimeError(f"Checkpoint not found for model {job['model_id']}")

        def _logger(line: str) -> None:
            asyncio.run_coroutine_threadsafe(self._append_log(job["id"], line), loop)

        result = await asyncio.to_thread(
            run_case_inference,
            source_repo_root=self._source_repo_root,
            checkpoint_path=checkpoint,
            case_id=case["id"],
            case_inputs=inputs,
            case_outputs_dir=outputs,
            profile=job["profile"],
            model_id=job["model_id"],
            selected_modalities=job["selected_modalities"],
            log=_logger,
        )

        await self.case_store.set_duration(case["id"], float(result["elapsed_seconds"]))

    async def _append_log(self, job_id: str, line: str) -> None:
        next_line = self._line_counters.get(job_id, 0) + 1
        self._line_counters[job_id] = next_line
        await self.job_store.append_log_line(job_id, next_line, line)

    async def _refresh_queue_positions(self) -> None:
        all_jobs = await self.job_store.list_jobs()
        queued_jobs = [j for j in all_jobs if j["status"] == "queued"]
        queued_jobs.sort(key=lambda item: item["created_at"])
        for job in all_jobs:
            if job["status"] != "queued":
                await self.job_store.set_queue_position(job["id"], None)
        for idx, job in enumerate(queued_jobs, start=1):
            await self.job_store.set_queue_position(job["id"], idx)
