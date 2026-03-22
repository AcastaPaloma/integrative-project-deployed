from __future__ import annotations

from pathlib import Path
import shutil

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from config import get_settings
from services.case_store import CaseStore
from services.compatibility import compatibility_status

router = APIRouter(prefix="/cases", tags=["cases"])


class CreateCaseRequest(BaseModel):
    label: str = Field(min_length=1)
    notes: str = ""
    modalities: list[str] = []


class UpdateCaseRequest(BaseModel):
    label: str | None = None
    notes: str | None = None


class InferRequest(BaseModel):
    model_id: str
    profile: str | None = None


@router.get("")
async def list_cases():
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    return {"items": await store.list_cases()}


@router.post("")
async def create_case(payload: CreateCaseRequest, request: Request):
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    case = await store.create_case(payload.label, payload.notes, payload.modalities)
    request.app.state.job_manager.file_manager.ensure_case_dirs(case["id"])
    return case


@router.get("/{case_id}")
async def get_case(case_id: str):
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    case = await store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}")
async def update_case(case_id: str, payload: UpdateCaseRequest):
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    case = await store.update_case(case_id, payload.label, payload.notes)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/{case_id}")
async def delete_case(case_id: str, request: Request):
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    deleted = await store.delete_case(case_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")
    request.app.state.job_manager.file_manager.remove_case(case_id)
    return {"ok": True}


@router.post("/{case_id}/upload/{modality}")
async def upload_modality(case_id: str, modality: str, request: Request, file: UploadFile = File(...)):
    manager = request.app.state.job_manager
    if not manager.file_manager.validate_modality(modality):
        raise HTTPException(status_code=400, detail="Invalid modality")
    if not manager.file_manager.validate_filename(file.filename or ""):
        raise HTTPException(status_code=400, detail="Only .nii and .nii.gz files are allowed")

    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    case = await store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    target = manager.file_manager.input_path(case_id, modality)
    # Save to a temp file first, then gzip-compress if needed
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".nii.upload") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)
    manager.file_manager.save_upload(case_id, modality, tmp_path)
    tmp_path.unlink(missing_ok=True)

    updated_modalities = sorted(list(set(case["modalities"] + [modality])))
    await store.set_modalities(case_id, updated_modalities)
    await store.set_status(case_id, "ready")

    return {
        "case_id": case_id,
        "modality": modality,
        "filename": Path(file.filename or target.name).name,
        "saved_to": str(target),
        "modalities": updated_modalities,
    }


@router.delete("/{case_id}/upload/{modality}")
async def delete_uploaded_modality(case_id: str, modality: str, request: Request):
    manager = request.app.state.job_manager
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())
    case = await store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    path = manager.file_manager.input_path(case_id, modality)
    if path.exists():
        path.unlink(missing_ok=True)

    updated = [m for m in case["modalities"] if m != modality]
    await store.set_modalities(case_id, updated)
    return {"ok": True, "modalities": updated}


@router.post("/{case_id}/infer")
async def run_inference(case_id: str, payload: InferRequest, request: Request):
    manager = request.app.state.job_manager
    settings = get_settings()
    store = CaseStore(settings.db_path.resolve())

    case = await store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    selected_modalities = sorted(case["modalities"])
    if not selected_modalities:
        raise HTTPException(status_code=400, detail="No uploaded modalities found")

    compat = compatibility_status(payload.model_id, selected_modalities)
    if compat["status"] == "incompatible":
        raise HTTPException(status_code=400, detail=compat["reason"])

    profile = payload.profile or settings.default_profile

    job = await manager.enqueue_job(
        case_id=case_id,
        model_id=payload.model_id,
        profile=profile,
        selected_modalities=selected_modalities,
    )

    return {
        "job_id": job["id"],
        "status": job["status"],
        "queue_position": job["queue_position"],
        "compatibility": compat,
    }
