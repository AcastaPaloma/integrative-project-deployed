# IMPLEMENTATION TASK: Brain Segmentation Webapp

## Scope
Build a deployable local-first webapp in `integrative-project-deployed` with:
- `frontend/` (Next.js + TypeScript)
- `backend/` (FastAPI + SQLite)
- Direct inference integration from `../integrative-project/src`
- Model/metrics integration from `../integrative-project/checkpoints` and `../integrative-project/outputs/results`
- Light-mode liquid-glass UI
- 2D/3D viewer with multi-overlay comparison presets

## Milestones

### 1. Bootstrap and contracts
Deliver:
- `frontend/` + `backend/` foundations
- API contracts for cases/jobs/models/files/system
- env templates and path configuration

Acceptance:
- `frontend/package.json` has Next.js, TypeScript, NiiVue, Zustand, SWR, liquid-glass-react.
- `backend/requirements.txt` has FastAPI runtime + scientific IO deps.
- `.env.example` contains checkpoints/results/config/data path settings.

### 2. Backend runtime core
Deliver:
- FastAPI app shell and DB init
- checkpoint registry and results parser

Acceptance:
- `backend/main.py` boots and mounts routers.
- `backend/db/schema.sql` defines `cases`, `jobs`, `log_lines`.
- `backend/services/model_registry.py` discovers checkpoint models.
- `backend/services/result_registry.py` parses JSON metrics and treats Infinity/NaN as `N/A`.

### 3. Inference orchestration and queue
Deliver:
- single-job FIFO queue
- inference bridge to training repo

Acceptance:
- `backend/services/job_manager.py` enforces one running job.
- `backend/services/inference_runner.py` imports and invokes `src.inference.predict.run_inference`.
- `backend/routers/jobs.py` supports create/status/cancel/retry and SSE logs.

### 4. Frontend foundation and flows
Deliver:
- Dashboard, New Case, Case Library, Viewer, Export, Settings
- typed API client and async state hooks

Acceptance:
- `frontend/app/page.tsx` shows system/case/job summary.
- `frontend/app/cases/new/page.tsx` supports upload + model selection + run.
- `frontend/app/cases/page.tsx` supports list/search/filter/sort.
- `frontend/lib/api.ts` covers all API routes with typed payloads.

### 5. Viewer and overlay comparison
Deliver:
- NiiVue synchronized 2D/3D visualization
- overlay comparison presets and controls

Acceptance:
- `frontend/components/viewer/NiiVueViewer.tsx` renders base + overlays in 2D and 3D.
- `frontend/components/viewer/ViewerToolbar.tsx` includes reset/screenshot/fullscreen/layout/crosshair/ruler/comparison preset actions.
- `frontend/components/viewer/LayerControls.tsx` supports visibility/opacity/color/blend/threshold.
- `frontend/app/cases/[caseId]/page.tsx` restores comparison session state.

### 6. Export and persistence
Deliver:
- export flow and persistent case/session state

Acceptance:
- `frontend/app/cases/[caseId]/export/page.tsx` exports expected output artifacts.
- `backend/routers/files.py` serves NIfTI files and bundles outputs.

### 7. Setup and validation
Deliver:
- native Windows startup and Docker startup path
- sample-case runbook

Acceptance:
- `start.ps1` starts backend + frontend with preflight checks.
- `docker-compose.yml` runs full stack with mapped data and sibling-repo paths.
- `README.md` includes setup and sample-case test instructions.

## Hard decisions locked
- CPU-first runtime, optional CUDA.
- `.nii`/`.nii.gz` uploads only.
- Default model: `unet_3ch_no_t1`.
- Exact modality match required except `unet_4ch` (allowed with explicit degraded-accuracy warning).
- Default profile `tuned`, switchable.
- Always-visible non-diagnostic disclaimer on viewer/export pages.
- Data persists until user delete.
- One-command Windows startup + Docker option.
- Inference overlays must compare against source volumes in both 2D and 3D.

## Sample-case verification target
1. Create case, upload modalities, run inference.
2. Observe states: `ready -> queued -> running -> completed`.
3. Open viewer and verify 2D/3D overlay visualization.
4. Use comparison presets and confirm rendering updates.
5. Export files and verify expected outputs (`prediction_labels.nii.gz`, `mask_wt.nii.gz`, `mask_tc.nii.gz`, `mask_et.nii.gz`, logs).
6. Reopen case and confirm comparison settings persist.
