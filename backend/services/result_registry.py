from pathlib import Path
from typing import Dict, Any
import json
import math


def _safe(value: Any):
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _extract_mean_all(payload: Dict[str, Any]) -> float | None:
    if "aggregated" in payload and isinstance(payload["aggregated"], dict):
        val = payload["aggregated"].get("dice/mean_all")
        return _safe(val)
    if "mean_dice" in payload:
        return _safe(payload.get("mean_dice"))
    if "per_case_dice" in payload and isinstance(payload["per_case_dice"], list):
        values = []
        for case_scores in payload["per_case_dice"]:
            if not isinstance(case_scores, list):
                continue
            for score in case_scores:
                safe_score = _safe(score)
                if isinstance(safe_score, (int, float)):
                    values.append(float(safe_score))
        if values:
            return sum(values) / len(values)
    return None


def list_model_metrics(results_dir: Path) -> Dict[str, Dict[str, Any]]:
    metrics: Dict[str, Dict[str, Any]] = {}
    if not results_dir.exists():
        return metrics

    for child in results_dir.iterdir():
        if not child.is_dir():
            continue
        eval_file = child / "evaluation_results.json"
        if not eval_file.exists():
            continue
        try:
            payload = json.loads(eval_file.read_text(encoding="utf-8"))
            mean_all = _extract_mean_all(payload)
            metrics[child.name] = {
                "mean_dice": mean_all,
                "source": str(eval_file),
            }
        except (json.JSONDecodeError, OSError, TypeError, ValueError):
            metrics[child.name] = {
                "mean_dice": None,
                "source": str(eval_file),
                "parse_error": True,
            }
    return metrics
