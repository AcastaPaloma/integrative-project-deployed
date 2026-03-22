from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(request: Request):
    manager = request.app.state.job_manager
    return {"items": await manager.list_jobs()}


@router.get("/{job_id}")
async def get_job(job_id: str, request: Request):
    manager = request.app.state.job_manager
    job = await manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}")
async def cancel_job(job_id: str, request: Request):
    manager = request.app.state.job_manager
    ok = await manager.cancel_job(job_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Only queued jobs can be cancelled")
    return {"ok": True}


@router.post("/{job_id}/retry")
async def retry_job(job_id: str, request: Request):
    manager = request.app.state.job_manager
    job = await manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "failed":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")

    retried = await manager.enqueue_job(
        case_id=job["case_id"],
        model_id=job["model_id"],
        profile=job["profile"],
        selected_modalities=job["selected_modalities"],
    )
    return retried


@router.get("/{job_id}/log")
async def stream_job_log(job_id: str, request: Request):
    manager = request.app.state.job_manager
    job = await manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    last_event_id = request.headers.get("Last-Event-ID")
    try:
        line_cursor = int(last_event_id) if last_event_id else 0
    except ValueError:
        line_cursor = 0

    async def event_generator():
        nonlocal line_cursor
        while True:
            if await request.is_disconnected():
                break

            lines = await manager.job_store.get_log_lines(job_id, after_line=line_cursor)
            for entry in lines:
                line_cursor = entry["line_number"]
                payload = json.dumps(entry)
                yield f"id: {line_cursor}\nevent: log\ndata: {payload}\n\n"

            current = await manager.get_job(job_id)
            if current and current["status"] in {"completed", "failed", "cancelled"}:
                status_payload = json.dumps({"status": current["status"], "error_message": current.get("error_message")})
                yield f"event: job_status\ndata: {status_payload}\n\n"
                break

            await asyncio.sleep(0.4)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
