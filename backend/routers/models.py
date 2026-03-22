from fastapi import APIRouter
from fastapi import Query

from config import get_settings
from services.model_registry import list_models
from services.result_registry import list_model_metrics
from services.compatibility import compatibility_status

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
async def get_models(uploaded_modalities: str | None = Query(default=None)):
    settings = get_settings()
    models = list_models(settings.checkpoints_dir.resolve())
    metrics = list_model_metrics(settings.results_dir.resolve())
    uploaded = []
    if uploaded_modalities:
        uploaded = [m.strip() for m in uploaded_modalities.split(",") if m.strip()]

    enriched = []
    for m in models:
        model_metrics = metrics.get(m["id"], {})
        comp = compatibility_status(m["id"], uploaded) if uploaded else None
        enriched.append({**m, "metrics": model_metrics, "compatibility": comp})

    enriched.sort(key=lambda x: (x["metrics"].get("mean_dice") is None, -(x["metrics"].get("mean_dice") or -1.0)))
    return {"items": enriched}
