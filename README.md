# Brain Segmentation Webapp

Production-ready local deployment scaffold for brain tumor segmentation using:
- Frontend: Next.js (App Router, TypeScript)
- Backend: FastAPI + SQLite + job queue + SSE logs
- Inference: direct integration with `../integrative-project` checkpoints and source pipeline

## Features implemented
- Case CRUD with persistent SQLite storage.
- Modality uploads (`flair`, `t1`, `t1ce`, `t2`) as `.nii/.nii.gz`.
- Model registry from `../integrative-project/checkpoints`.
- Ranking metrics parsed from `../integrative-project/outputs/results`.
- Compatibility checks including `unet_4ch` subset warning path.
- Single-job FIFO queue with persisted statuses.
- SSE log streaming endpoint for live inference logs.
- Inference runner via direct imports from training repo.
- Output artifacts generated:
  - `prediction_labels.nii.gz`
  - `mask_wt.nii.gz`
  - `mask_tc.nii.gz`
  - `mask_et.nii.gz`
- Viewer page with NiiVue overlays in 2D and 3D render modes.
- Export ZIP endpoint and UI link.

## Prerequisites
- Windows 10/11
- Python 3.11+ on PATH
- Node.js 20+ on PATH
- Sibling repository at `../integrative-project`
- Optional CUDA-capable GPU (CPU fallback supported)

## One-command startup
From `d:/Coding/integrative-project-deployed`:

```powershell
./start.ps1
```

This script:
1. Ensures `.env` exists (copied from `.env.example` when missing).
2. Creates backend `.venv` if needed.
3. Installs backend requirements and starts FastAPI on `http://localhost:8000`.
4. Installs frontend dependencies and starts Next.js on `http://localhost:3000`.

## Manual startup (alternative)

```powershell
# terminal 1: backend
Set-Location d:/Coding/integrative-project-deployed/backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
python -m ensurepip --upgrade
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# terminal 2: frontend
Set-Location d:/Coding/integrative-project-deployed/frontend
npm install
npm run dev
```

## Environment configuration
Copy and edit if needed:

```powershell
Copy-Item .env.example .env
```

Default paths assume this workspace layout:
- `d:/Coding/integrative-project-deployed`
- `d:/Coding/integrative-project`

## Sample-case test workflow

### A. UI flow
1. Open `http://localhost:3000/cases/new`.
2. Create a new case.
3. Open the case page from `/cases`.
4. Upload modalities (at minimum those required by selected model).
5. Select model and click `Start inference`.
6. Watch logs stream in the case sidebar.
7. After completion, verify overlays in viewer:
  - 2D multi-planar mode
  - 3D render mode
8. Open `/cases/[caseId]/export` and download ZIP.

### B. API verification flow
1. Health:
```powershell
Invoke-RestMethod http://127.0.0.1:8000/system/health
```
2. Models:
```powershell
Invoke-RestMethod http://127.0.0.1:8000/models | ConvertTo-Json -Depth 4
```
3. Cases:
```powershell
Invoke-RestMethod http://127.0.0.1:8000/cases | ConvertTo-Json -Depth 4
```
4. SSE logs for a job:
```powershell
curl.exe -N http://127.0.0.1:8000/jobs/<job_id>/log
```

## Verified end-to-end run (in this workspace)
A full backend workflow was executed successfully:
- case created
- modalities uploaded
- job queued and executed
- status progressed to `completed`
- SSE logs emitted
- output artifacts generated in case output directory

## Important notes
- This application is for research use only.
- Outputs are non-diagnostic and must not guide clinical decisions.
- CPU inference is supported but slower.

## Key paths
- Backend: `backend/`
- Frontend: `frontend/`
- Runtime data: `data/`
- Task breakdown: `IMPLEMENTATION_TASK.md`
- Plan prompt: `.github/prompts/plan-brainSegmentationWebapp.prompt.md`
