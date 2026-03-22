from __future__ import annotations

import copy
from datetime import datetime, timezone
from pathlib import Path
import sys
import time
from typing import Callable

import nibabel as nib
import numpy as np
import torch

from services.compatibility import required_modalities_for_model


def configure_training_repo_imports(source_repo_root: Path) -> None:
    src_path = (source_repo_root / "src").resolve()
    root_path = source_repo_root.resolve()
    if str(root_path) not in sys.path:
        sys.path.append(str(root_path))
    if str(src_path) not in sys.path:
        sys.path.append(str(src_path))


def _load_checkpoint_config(checkpoint_path: Path) -> dict:
    checkpoint = torch.load(str(checkpoint_path), map_location="cpu")
    if "config" not in checkpoint:
        raise RuntimeError("Checkpoint does not contain embedded config")
    return copy.deepcopy(checkpoint["config"])


def _create_dummy_seg(reference_volume: Path, target_path: Path) -> None:
    nii = nib.load(str(reference_volume))
    zeros = np.zeros(nii.shape, dtype=np.uint8)
    out = nib.Nifti1Image(zeros, affine=nii.affine, header=nii.header)
    nib.save(out, str(target_path))


def _prepare_sample_dict(case_id: str, inputs: dict[str, str], seg_path: Path) -> dict:
    sample = {"patient_id": case_id, "seg": str(seg_path)}
    for modality in ["flair", "t1", "t1ce", "t2"]:
        sample[modality] = inputs.get(modality)
    return sample


def _ensure_zero_padded_modalities_for_unet4ch(case_inputs: dict[str, str], case_inputs_dir: Path) -> dict[str, str]:
    required = ["flair", "t1", "t1ce", "t2"]
    if all(modality in case_inputs for modality in required):
        return case_inputs

    reference_path = Path(next(iter(case_inputs.values())))
    updated = dict(case_inputs)
    for modality in required:
        if modality not in updated:
            synthetic_path = case_inputs_dir / f"{modality}.nii.gz"
            _create_dummy_seg(reference_path, synthetic_path)
            updated[modality] = str(synthetic_path)
    return updated


def run_case_inference(
    *,
    source_repo_root: Path,
    checkpoint_path: Path,
    case_id: str,
    case_inputs: dict[str, str],
    case_outputs_dir: Path,
    profile: str,
    model_id: str,
    selected_modalities: list[str],
    log: Callable[[str], None],
) -> dict:
    started = time.perf_counter()
    configure_training_repo_imports(source_repo_root)

    from src.inference.predict import run_inference  # pylint: disable=import-error

    log(f"[INFO] Starting inference for case {case_id}")
    log(f"[INFO] Model: {model_id}")
    log(f"[INFO] Profile: {profile}")

    case_outputs_dir.mkdir(parents=True, exist_ok=True)
    inputs_dir = case_outputs_dir.parent / "inputs"

    if model_id == "unet_4ch":
        case_inputs = _ensure_zero_padded_modalities_for_unet4ch(case_inputs, inputs_dir)
        selected_modalities = ["flair", "t1", "t1ce", "t2"]
        log("[WARN] Running unet_4ch with zero-padded missing modalities may degrade accuracy")

    if not case_inputs:
        raise RuntimeError("No uploaded modalities found for this case")

    checkpoint_cfg = _load_checkpoint_config(checkpoint_path)
    cfg = copy.deepcopy(checkpoint_cfg)

    cfg["paths"]["predictions_dir"] = str(case_outputs_dir)
    cfg["inference"]["sw_batch_size"] = 1
    cfg["logging"]["use_wandb"] = False
    if not torch.cuda.is_available():
        cfg["training"]["mixed_precision"] = False

    required_modalities = required_modalities_for_model(model_id)
    if model_id != "unet_4ch":
        missing = [m for m in required_modalities if m not in case_inputs]
        if missing:
            raise RuntimeError(f"Missing required modalities for {model_id}: {', '.join(missing)}")

    reference_path = Path(next(iter(case_inputs.values())))
    seg_path = case_outputs_dir / "_dummy_seg.nii.gz"
    _create_dummy_seg(reference_path, seg_path)

    sample = _prepare_sample_dict(case_id, case_inputs, seg_path)
    run_modalities = selected_modalities
    if model_id == "unet_4ch":
        run_modalities = ["flair", "t1", "t1ce", "t2"]

    log(f"[INFO] Modalities used: {', '.join(run_modalities)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log(f"[INFO] Device: {device}")

    results = run_inference(
        cfg=cfg,
        checkpoint_path=str(checkpoint_path),
        samples=[sample],
        output_dir=str(case_outputs_dir),
        device=device,
        num_cases=1,
        modalities=run_modalities,
    )

    pred_file = case_outputs_dir / f"{case_id}_pred.nii.gz"
    if not pred_file.exists():
        raise RuntimeError("Prediction file was not generated")

    seg = nib.load(str(pred_file)).get_fdata().astype(np.uint8)
    ref_nii = nib.load(str(pred_file))

    wt = (seg > 0).astype(np.uint8)
    tc = np.isin(seg, [1, 4]).astype(np.uint8)
    et = (seg == 4).astype(np.uint8)

    nib.save(nib.Nifti1Image(seg, ref_nii.affine, ref_nii.header), str(case_outputs_dir / "prediction_labels.nii.gz"))
    nib.save(nib.Nifti1Image(wt, ref_nii.affine, ref_nii.header), str(case_outputs_dir / "mask_wt.nii.gz"))
    nib.save(nib.Nifti1Image(tc, ref_nii.affine, ref_nii.header), str(case_outputs_dir / "mask_tc.nii.gz"))
    nib.save(nib.Nifti1Image(et, ref_nii.affine, ref_nii.header), str(case_outputs_dir / "mask_et.nii.gz"))

    if seg_path.exists():
        seg_path.unlink(missing_ok=True)

    elapsed = time.perf_counter() - started
    log(f"[INFO] Inference completed in {elapsed:.2f}s")

    return {
        "elapsed_seconds": elapsed,
        "prediction_path": str(pred_file),
        "result_count": len(results),
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
