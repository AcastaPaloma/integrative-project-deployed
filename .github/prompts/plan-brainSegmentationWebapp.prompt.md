## Plan: Deployable Brain Segmentation Webapp

Build a full-stack local app in `d:/Coding/integrative-project-deployed` with `frontend/` (Next.js) and `backend/` (FastAPI), directly reusing inference from `d:/Coding/integrative-project/src`, scanning `d:/Coding/integrative-project/checkpoints` and `d:/Coding/integrative-project/outputs/results`, and shipping a liquid-glass light-mode UI with a viewer toolbar and 3D in v1.
Plan is saved to `/memories/session/plan.md`.

**Steps**
1. Phase 1, scaffold and contracts: create `frontend/`, `backend/`, root `docker-compose.yml`, `start.ps1`, `.env.example`, `README.md`; freeze API contracts first to avoid FE/BE drift.
2. Phase 2, backend core: build FastAPI routers (`cases`, `jobs`, `models`, `files`, `system`), SQLite schema (`cases/jobs/log_lines`), model/results registries, and compatibility engine.
3. Phase 2, inference integration: call `src.inference.predict.run_inference` via direct imports (not shelling out), default to `configs/tuned.yaml` with easy switching to `full/dev`.
4. Phase 2, job runtime: implement strict single-job FIFO queue, persisted states, SSE log streaming, hardware/status endpoints, and output post-processing to `prediction_labels.nii.gz`, `mask_wt.nii.gz`, `mask_tc.nii.gz`, `mask_et.nii.gz`.
5. Phase 3, frontend foundation: implement pages (Dashboard, Upload, Case Library, Viewer, Export, Settings), typed API client, Zustand + SWR + SSE hooks, and global warning/disclaimer behavior.
6. Phase 3, visual system: integrate `liquid-glass-react` plus custom light-theme CSS variables for intentional grouped workflows and clear affordances.
7. Phase 4, user flows: upload `.nii/.nii.gz`, modality classification + correction, model ranking/compatibility, queue run, job logs/timer, case management, and settings/profile switch.
8. Phase 5, viewer + toolbar: synchronized orthogonal views + 3D panel, layouts (`2x2`, `single`, `3+1`), crosshair sync toggle, layer controls, screenshot/fullscreen/reset, and basic ruler (voxel/mm).
9. Phase 5A, comparison overlays in 3D and 2D: support loading baseline/reference volumes and multiple prediction outputs as stacked overlays so users can compare model runs and ground-reference side by side or blended in the same scene.
10. Phase 5A details: provide per-overlay controls for visibility, opacity, color map, threshold, blend mode (normal/additive/difference), and synchronized clipping planes in 3D.
11. Phase 5A tooling: add a viewer toolbar group for comparison presets (`Prediction vs MRI`, `Model A vs Model B`, `Prediction vs Reference`) and a quick toggle to flip between active overlays.
12. Phase 5A outputs: persist comparison sessions per case (chosen overlays, blend settings, camera pose, clipping planes) so users can revisit exact views.
13. Phase 6, deployability: Windows-first one-command startup (`start.ps1`), optional Docker path, runtime data in `integrative-project-deployed/data`, docs for CPU-first and optional CUDA.
14. Phase 7, verification: backend tests (queue/API/parser), frontend checks, end-to-end upload->infer->view->export validation on native Windows and Docker.

**Relevant files**
- `d:/Coding/integrative-project-deployed/backend/main.py`
- `d:/Coding/integrative-project-deployed/backend/config.py`
- `d:/Coding/integrative-project-deployed/backend/services/inference_runner.py`
- `d:/Coding/integrative-project-deployed/backend/services/job_manager.py`
- `d:/Coding/integrative-project-deployed/backend/services/model_registry.py`
- `d:/Coding/integrative-project-deployed/backend/services/result_registry.py`
- `d:/Coding/integrative-project-deployed/backend/db/schema.sql`
- `d:/Coding/integrative-project-deployed/frontend/app/cases/[caseId]/page.tsx`
- `d:/Coding/integrative-project-deployed/frontend/components/viewer/NiiVueViewer.tsx`
- `d:/Coding/integrative-project-deployed/frontend/components/viewer/ViewerToolbar.tsx`
- `d:/Coding/integrative-project-deployed/start.ps1`
- `d:/Coding/integrative-project-deployed/docker-compose.yml`
- `d:/Coding/integrative-project-deployed/IMPLEMENTATION_TASK.md`
- `d:/Coding/integrative-project/src/inference/predict.py`
- `d:/Coding/integrative-project/configs/tuned.yaml`

**Locked decisions from your answers**
1. `frontend/ + backend/` inside `integrative-project-deployed`.
2. CPU-first runtime with optional CUDA fallback.
3. `.nii` and `.nii.gz` uploads only.
4. Default model: `unet_3ch_no_t1`.
5. Exact-modality matching for all models except `unet_4ch`; `unet_4ch` may run subsets with explicit degraded-accuracy warning.
6. Include 3D viewer in first release.
7. Toolbar includes reset, screenshot, fullscreen, layout switcher, crosshair toggle, and basic ruler.
8. Default inference profile `tuned`, switchable.
9. Parse `outputs/results` for rankings; show Infinity/NaN as `N/A` and exclude from ranking.
10. Always-visible non-diagnostic disclaimer on viewer/export pages.
11. Persistent data until manual delete.
12. One-command Windows startup plus Docker path.
13. Comparison-first viewer behavior: inference outputs must be overlaid on existing volumes in both 2D and 3D with user-controlled blend settings.

**Setup instructions to include in final implementation**
1. Prerequisites (Windows): Python 3.11, Node 20+, npm, optional CUDA toolkit and compatible GPU drivers.
2. Install backend dependencies from `d:/Coding/integrative-project-deployed/backend/requirements.txt`.
3. Install frontend dependencies from `d:/Coding/integrative-project-deployed/frontend/package.json`.
4. Configure `.env` paths so backend can read `d:/Coding/integrative-project/checkpoints`, `d:/Coding/integrative-project/outputs/results`, and `d:/Coding/integrative-project/configs`.
5. Start app with `d:/Coding/integrative-project-deployed/start.ps1` for native run, or `docker-compose up` for containerized run.
6. Verify health endpoints and UI boot before first inference run.

**Sample-case test instructions to include in final implementation**
1. Create a new case and upload one patient set (`.nii`/`.nii.gz`) with valid modality mapping.
2. Select `unet_3ch_no_t1` as default and run inference using `tuned` profile.
3. Confirm queue state progression: `ready -> queued -> running -> completed`.
4. Open viewer and verify overlays load on top of source MRI in 2D and 3D.
5. In 3D, adjust opacity and blend mode, then switch to comparison preset (`Prediction vs MRI`) and confirm render updates correctly.
6. If a second prediction exists, compare Model A vs Model B using overlay toggle and ensure synchronized camera/slice controls.
7. Capture screenshot, export results, and verify `prediction_labels.nii.gz`, `mask_wt.nii.gz`, `mask_tc.nii.gz`, `mask_et.nii.gz`, and logs are present.
8. Reopen the same case and confirm comparison session settings are restored.

If this is approved, next step is handoff to implementation mode to execute this plan exactly.

**Implementation milestones and acceptance criteria**

**Milestone 1: Project bootstrap and contracts**
1. Create `frontend/` and `backend/` foundations with dependency manifests and env templates.
2. Freeze API contracts for `cases`, `jobs`, `models`, `files`, `system`.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/frontend/package.json`: includes Next.js, TypeScript, niivue, Zustand, SWR, liquid-glass-react.
- `d:/Coding/integrative-project-deployed/backend/requirements.txt`: includes fastapi, uvicorn, aiosqlite, pydantic-settings, nibabel, numpy.
- `d:/Coding/integrative-project-deployed/.env.example`: defines checkpoints/results/configs/data paths and default inference profile.

**Milestone 2: Backend runtime core**
1. Implement FastAPI app shell and DB initialization.
2. Build model registry and results parser from existing repository assets.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/backend/main.py`: app starts and mounts all routers.
- `d:/Coding/integrative-project-deployed/backend/db/schema.sql`: tables for `cases`, `jobs`, `log_lines` with indexes.
- `d:/Coding/integrative-project-deployed/backend/services/model_registry.py`: discovers all model folders in checkpoints.
- `d:/Coding/integrative-project-deployed/backend/services/result_registry.py`: reads `evaluation_results.json` and handles Infinity/NaN as `N/A`.

**Milestone 3: Inference orchestration and queue**
1. Add single-job FIFO manager and state machine.
2. Integrate inference via direct imports from training repository.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/backend/services/job_manager.py`: enforces one active job and persistent state transitions.
- `d:/Coding/integrative-project-deployed/backend/services/inference_runner.py`: imports and calls `src.inference.predict.run_inference` with profile switch support.
- `d:/Coding/integrative-project-deployed/backend/routers/jobs.py`: create/status/cancel/retry and SSE log endpoints work.

**Milestone 4: Frontend foundation and data flows**
1. Implement core app pages and typed API client.
2. Wire upload, case list, dashboard, settings and status polling.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/frontend/app/page.tsx`: dashboard renders system status, recent cases, active job tile.
- `d:/Coding/integrative-project-deployed/frontend/app/cases/new/page.tsx`: upload + modality mapping + model selection + run action.
- `d:/Coding/integrative-project-deployed/frontend/app/cases/page.tsx`: case library search/filter/status.
- `d:/Coding/integrative-project-deployed/frontend/lib/api.ts`: typed calls for all backend routes.

**Milestone 5: Viewer, overlays, and comparison UX**
1. Build synchronized 2D/3D viewer with toolbar and layer controls.
2. Add overlay comparison presets and persisted comparison sessions.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/frontend/components/viewer/NiiVueViewer.tsx`: supports source volume + multiple overlays in 2D and 3D.
- `d:/Coding/integrative-project-deployed/frontend/components/viewer/ViewerToolbar.tsx`: reset/screenshot/fullscreen/layout/crosshair/ruler + comparison presets.
- `d:/Coding/integrative-project-deployed/frontend/components/viewer/LayerControls.tsx`: per-layer visibility, opacity, color, blend mode, threshold.
- `d:/Coding/integrative-project-deployed/frontend/app/cases/[caseId]/page.tsx`: renders viewer and restores comparison session state.

**Milestone 6: Export and persistence**
1. Add export flow for masks, labels, logs, screenshots.
2. Ensure persistent case storage and reopen support.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/frontend/app/cases/[caseId]/export/page.tsx`: export UX and file download actions.
- `d:/Coding/integrative-project-deployed/backend/routers/files.py`: serves outputs reliably for viewer and downloads.

**Milestone 7: Setup, startup, and validation**
1. Provide one-command Windows startup and Docker path.
2. Add sample-case runbook and verification checklist.

Acceptance criteria by file:
- `d:/Coding/integrative-project-deployed/start.ps1`: boots backend and frontend locally with preflight checks.
- `d:/Coding/integrative-project-deployed/docker-compose.yml`: starts frontend/backend with mounted data and sibling repo assets.
- `d:/Coding/integrative-project-deployed/README.md`: setup + sample-case test instructions are complete and reproducible.
