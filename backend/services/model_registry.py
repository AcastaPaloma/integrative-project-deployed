from pathlib import Path
from typing import List, Dict


def infer_modalities_from_name(model_name: str) -> List[str]:
    name = model_name.lower()
    tokens = name.split("_")
    known = ["flair", "t1", "t1ce", "t2"]
    if "no_t1" in name:
        return ["flair", "t1ce", "t2"]
    modalities = [m for m in known if m in tokens]
    if "4ch" in tokens or name.endswith("_4ch"):
        return ["flair", "t1", "t1ce", "t2"]
    return modalities


def list_models(checkpoints_dir: Path) -> List[Dict]:
    models: List[Dict] = []
    if not checkpoints_dir.exists():
        return models

    for child in sorted(checkpoints_dir.iterdir()):
        if not child.is_dir():
            continue
        best = child / "best_model.pth"
        last = child / "last_model.pth"
        if not best.exists() and not last.exists():
            continue
        models.append(
            {
                "id": child.name,
                "name": child.name,
                "checkpoint": str(best if best.exists() else last),
                "modalities": infer_modalities_from_name(child.name),
                "supports_subset": child.name == "unet_4ch",
            }
        )
    return models
