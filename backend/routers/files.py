from __future__ import annotations

from io import BytesIO
import zipfile

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/cases/{case_id}/inputs/{modality}")
async def get_input_file(case_id: str, modality: str, request: Request):
    manager = request.app.state.job_manager
    path = manager.file_manager.input_path(case_id, modality)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Input file not found")
    return FileResponse(path)


@router.get("/cases/{case_id}/outputs/{filename}")
async def get_output_file(case_id: str, filename: str, request: Request):
    manager = request.app.state.job_manager
    path = manager.file_manager.output_path(case_id, filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    return FileResponse(path)


@router.get("/cases/{case_id}/outputs")
async def list_output_files(case_id: str, request: Request):
    manager = request.app.state.job_manager
    return {"items": manager.file_manager.list_output_files(case_id)}


@router.get("/cases/{case_id}/export")
async def export_case(case_id: str, request: Request, files: list[str] = Query(default=[])):
    manager = request.app.state.job_manager
    outputs_dir = manager.file_manager.case_dir(case_id) / "outputs"
    if not outputs_dir.exists():
        raise HTTPException(status_code=404, detail="Case outputs not found")

    requested = files or [
        "prediction_labels.nii.gz",
        "mask_wt.nii.gz",
        "mask_tc.nii.gz",
        "mask_et.nii.gz",
    ]

    memory = BytesIO()
    with zipfile.ZipFile(memory, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name in requested:
            path = outputs_dir / name
            if path.exists() and path.is_file():
                zf.write(path, arcname=name)

    memory.seek(0)
    filename = f"{case_id}_export.zip"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(memory, media_type="application/zip", headers=headers)
