from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
SOURCE_REPO_DEFAULT = BASE_DIR.parent / "integrative-project"


class Settings(BaseSettings):
    app_name: str = "Brain Segmentation Webapp API"
    app_env: str = "dev"
    data_dir: Path = BASE_DIR / "data"
    db_path: Path = BASE_DIR / "data" / "app.db"

    source_repo_root: Path = SOURCE_REPO_DEFAULT
    checkpoints_dir: Path = SOURCE_REPO_DEFAULT / "checkpoints"
    results_dir: Path = SOURCE_REPO_DEFAULT / "outputs" / "results"
    configs_dir: Path = SOURCE_REPO_DEFAULT / "configs"
    default_profile: str = "tuned"

    allow_cors_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), env_prefix="BACKEND_", extra="ignore")

    def model_post_init(self, __context: object) -> None:
        """Resolve relative Path fields against BASE_DIR (project root) instead of CWD."""
        path_fields = ["data_dir", "db_path", "source_repo_root", "checkpoints_dir", "results_dir", "configs_dir"]
        for field_name in path_fields:
            value = getattr(self, field_name)
            if isinstance(value, Path) and not value.is_absolute():
                resolved = (BASE_DIR / value).resolve()
                object.__setattr__(self, field_name, resolved)


def get_settings() -> Settings:
    return Settings()
