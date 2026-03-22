from fastapi import APIRouter
from pathlib import Path
import shutil

try:
    import torch
except ImportError:
    torch = None

from config import get_settings

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def health():
    return {"ok": True}


@router.get("/status")
async def status():
    settings = get_settings()
    data_dir = Path(settings.data_dir)
    total, used, free = shutil.disk_usage(data_dir if data_dir.exists() else Path.cwd())
    cuda_available = bool(torch and torch.cuda.is_available())
    return {
        "cuda_available": cuda_available,
        "device": "cuda" if cuda_available else "cpu",
        "default_profile": settings.default_profile,
        "disk": {"total": total, "used": used, "free": free},
    }
