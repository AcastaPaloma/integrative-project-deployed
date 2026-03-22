from __future__ import annotations

from typing import Iterable


# Models that support cross-modality inference (can run with fewer
# modalities than they were trained on, using zero-padding).
CROSS_MODALITY_MODELS = {"unet_4ch"}


def required_modalities_for_model(model_id: str) -> list[str]:
    """Return the exact modalities a model was trained with."""
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

    # --- Cross-modality models (unet_4ch): allow subsets with a warning ---
    if model_id in CROSS_MODALITY_MODELS:
        missing = sorted(list(required - uploaded))
        extra = sorted(list(uploaded - required))
        if extra:
            return {
                "status": "incompatible",
                "reason": f"Extra modalities not accepted: {', '.join(extra)}. Required: {', '.join(sorted(required))}",
                "missing": [],
            }
        if missing:
            return {
                "status": "warning",
                "reason": f"Cross-modality mode: zero-padding missing modalities ({', '.join(missing)})",
                "missing": missing,
            }
        return {"status": "compatible", "reason": "Exact match — all 4 channels present", "missing": []}

    # --- Standard models: require EXACT match, no more, no less ---
    missing = sorted(list(required - uploaded))
    extra = sorted(list(uploaded - required))

    if missing and extra:
        return {
            "status": "incompatible",
            "reason": f"Missing: {', '.join(missing)}. Extra: {', '.join(extra)}. Requires exactly: {', '.join(sorted(required))}",
            "missing": missing,
        }
    if missing:
        return {
            "status": "incompatible",
            "reason": f"Missing required modalities: {', '.join(missing)}",
            "missing": missing,
        }
    if extra:
        return {
            "status": "incompatible",
            "reason": f"Extra modalities not accepted: {', '.join(extra)}. Requires exactly: {', '.join(sorted(required))}",
            "missing": [],
        }

    return {"status": "compatible", "reason": "Exact match", "missing": []}
