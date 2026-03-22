from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from contextlib import asynccontextmanager

from config import get_settings
from db.database import init_db
from routers.system import router as system_router
from routers.models import router as models_router
from routers.cases import router as cases_router
from routers.jobs import router as jobs_router
from routers.files import router as files_router
from services.job_manager import JobManager


settings = get_settings()


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    schema_path = Path(__file__).resolve().parent / "db" / "schema.sql"
    await init_db(settings.db_path.resolve(), schema_path)

    manager = JobManager(
        db_path=settings.db_path.resolve(),
        data_dir=settings.data_dir.resolve(),
        source_repo_root=settings.source_repo_root.resolve(),
        checkpoints_dir=settings.checkpoints_dir.resolve(),
    )
    await manager.start()
    fastapi_app.state.job_manager = manager

    try:
        yield
    finally:
        await manager.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allow_cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_router)
app.include_router(models_router)
app.include_router(cases_router)
app.include_router(jobs_router)
app.include_router(files_router)


@app.get("/")
async def root():
    return {"service": settings.app_name, "status": "running"}
