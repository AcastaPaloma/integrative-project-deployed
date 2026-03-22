from __future__ import annotations

from pathlib import Path
import shutil
from typing import Literal


Modality = Literal["flair", "t1", "t1ce", "t2"]
ALLOWED_MODALITIES = {"flair", "t1", "t1ce", "t2"}
ALLOWED_EXTENSIONS = {".nii", ".gz"}


class FileManager:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir.resolve()
        self.cases_dir = self.data_dir / "cases"
        self.cases_dir.mkdir(parents=True, exist_ok=True)

    def case_dir(self, case_id: str) -> Path:
        return self.cases_dir / case_id

    def ensure_case_dirs(self, case_id: str) -> Path:
        root = self.case_dir(case_id)
        (root / "inputs").mkdir(parents=True, exist_ok=True)
        (root / "outputs").mkdir(parents=True, exist_ok=True)
        return root

    def input_path(self, case_id: str, modality: str) -> Path:
        self.ensure_case_dirs(case_id)
        return self.case_dir(case_id) / "inputs" / f"{modality}.nii.gz"

    def output_path(self, case_id: str, filename: str) -> Path:
        self.ensure_case_dirs(case_id)
        safe_name = Path(filename).name
        return self.case_dir(case_id) / "outputs" / safe_name

    def remove_case(self, case_id: str) -> None:
        root = self.case_dir(case_id)
        if root.exists():
            shutil.rmtree(root)

    def validate_modality(self, modality: str) -> bool:
        return modality in ALLOWED_MODALITIES

    def validate_filename(self, filename: str) -> bool:
        name = filename.lower()
        return name.endswith(".nii") or name.endswith(".nii.gz")

    def list_input_files(self, case_id: str) -> dict[str, str]:
        inputs = {}
        root = self.case_dir(case_id) / "inputs"
        for modality in sorted(ALLOWED_MODALITIES):
            path = root / f"{modality}.nii.gz"
            if path.exists():
                inputs[modality] = str(path)
        return inputs

    def list_output_files(self, case_id: str) -> list[str]:
        root = self.case_dir(case_id) / "outputs"
        if not root.exists():
            return []
        return sorted([p.name for p in root.iterdir() if p.is_file()])
