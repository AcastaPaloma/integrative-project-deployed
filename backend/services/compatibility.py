from __future__ import annotations

from typing import Iterable


def required_modalities_for_model(model_id: str) -> list[str]:
    name = model_id.lower()
    if name == "unet_3ch_no_t1":
        return ["flair", "t1ce", "t2"]
    if name.endswith("_4ch") or "4ch" in name:
        return ["flair", "t1", "t1ce", "t2"]

    required = []
    for mod in ["flair", "t1ce", "t1", "t2"]:
        if mod in name:
            required.append(mod)
    return required


def compatibility_status(model_id: str, uploaded_modalities: Iterable[str]) -> dict:
    uploaded = set(uploaded_modalities)
    required = set(required_modalities_for_model(model_id))

    if model_id == "unet_4ch":
        missing = sorted(list(required - uploaded))
        if missing:
            return {
                "status": "warning",
                "reason": f"unet_4ch will run with zero-padded missing modalities: {', '.join(missing)}",
                "missing": missing,
            }
        return {"status": "compatible", "reason": "Exact match", "missing": []}

    missing = sorted(list(required - uploaded))
    if missing:
        return {
            "status": "incompatible",
            "reason": f"Missing required modalities: {', '.join(missing)}",
            "missing": missing,
        }

    return {"status": "compatible", "reason": "Exact match", "missing": []}
