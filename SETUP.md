# Setup Guide — Brain Segmentation Webapp

Three options: **Docker** (easiest), **conda** (GPU recommended), or **manual venv**.

> [!IMPORTANT]
> **Python 3.14 is NOT supported.** Use **Python 3.11** exactly. Python 3.14 breaks numpy<2.0 and MONAI 1.4, which are pinned dependencies.

---

## Prerequisites (all methods)

| Tool | Version | Why |
|------|---------|-----|
| Git | any | Clone repos |
| Node.js | 20+ | Frontend |
| Python | **3.11.x** | Backend + inference |

## 1. Clone both repos

```bash
# They MUST be siblings in the same parent folder
git clone <deployed-repo-url> integrative-project-deployed
git clone <training-repo-url>  integrative-project

# Result:
# some-folder/
#   integrative-project-deployed/   ← webapp
#   integrative-project/            ← models & training code
```

The `.env` paths use `../integrative-project` — this sibling layout is required.

---

## Option A: Docker (easiest, no GPU)

```bash
cd integrative-project-deployed
docker compose up
```

Backend on `:8000`, frontend on `:3000`. CPU-only inference (~5–15 min/case).

---

## Option B: Conda (recommended for GPU)

```bash
# 1. Create conda env with Python 3.11 + CUDA PyTorch
cd integrative-project
conda env create -f environment.yml
conda activate gtx-1080-IP

# 2. Install webapp backend deps into the same env
cd ../integrative-project-deployed/backend
pip install -r requirements.txt

# 3. Install frontend deps
cd ../frontend
npm install

# 4. Run
cd ..
./start.ps1          # Windows PowerShell
```

The `environment.yml` installs PyTorch with CUDA 12.1. Pick the right driver for your GPU below.

---

## Option C: Manual venv (no conda, CPU only)

```bash
# 1. Install Python 3.11 from python.org (NOT 3.12+, NOT 3.14!)
#    Verify: python --version → 3.11.x

# 2. Backend
cd integrative-project-deployed/backend
python -m venv .venv
.venv\Scripts\Activate.ps1           # Windows PowerShell
# source .venv/bin/activate          # macOS/Linux

pip install -r requirements.txt

# 3. Frontend
cd ../frontend && npm install

# 4. Run:  cd .. && ./start.ps1
```

---

## GPU Setup by Card

> [!TIP]
> After conda setup, verify GPU: `python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"`

### NVIDIA GTX 1080 *(your dev machine)*
- Architecture: Pascal — max CUDA 12.x ✅
- VRAM: 8 GB — handles all 10 models comfortably
- `environment.yml` is already configured for this card (`pytorch-cuda=12.1`)
- **Driver:** 525+ required → [Download](https://www.nvidia.com/Download/index.aspx)
- **Expected inference time:** ~45–90 s (4-ch model)

### NVIDIA GTX 1660 Super *(your friend's machine)*
- Architecture: Turing — max CUDA 12.x ✅
- VRAM: 6 GB — works for all models, may need `sw_batch_size=1` for 4-ch
- Same `environment.yml` works — just needs driver 525+
- **Driver:** [Download GTX 1660 SUPER driver](https://www.nvidia.com/Download/driverResults.aspx/218826/en-us/)
- **CUDA Toolkit reference:** [CUDA 12.1 for Windows](https://developer.nvidia.com/cuda-12-1-0-download-archive)
- **Expected inference time:** ~60–120 s (4-ch model)

### Other NVIDIA Cards (Pascal / Turing / Ampere / Ada)

| Card | VRAM | CUDA | Notes |
|------|------|------|-------|
| GTX 1060 / 1070 | 3–8 GB | 12.x | Use `sw_batch_size=1` if <6 GB VRAM |
| RTX 2060 / 2070 / 2080 | 6–11 GB | 12.x | All models, fast |
| RTX 3060 / 3070 / 3080 | 8–12 GB | 12.x | All models, fastest |
| RTX 4060 / 4070 | 8–12 GB | 12.x | All models, very fast |

**Universal driver/toolkit links:**
- [NVIDIA Driver Downloads](https://www.nvidia.com/Download/index.aspx)
- [CUDA 12.1 Toolkit Archive](https://developer.nvidia.com/cuda-12-1-0-download-archive)
- [PyTorch install selector](https://pytorch.org/get-started/locally/) — use if you want a different CUDA version

### AMD GPUs
- ROCm is experimental with MONAI. Not tested. Use Docker (CPU) as fallback.

### Apple Silicon (M1/M2/M3)
- MPS backend works but is not tested with MONAI 1.4 sliding window inference.
- Replace `pytorch-cuda=12.1` with a CPU/MPS PyTorch install.
- Docker (CPU) is safest on Mac.

---

## After startup

1. Open **http://localhost:3000**
2. **New Case** → name it → create
3. Upload `.nii.gz` modality files (flair, t1, t1ce, t2)
4. Select a model → **Start inference**
5. Logs stream live → viewer loads segmentation when done

---

## Inference time estimates

| Hardware | Single-modality model | 4-channel model |
|----------|-----------------------|-----------------|
| CPU only | 5–10 min | 10–20 min |
| GTX 1060 (6 GB) | ~90 s | ~2–3 min |
| GTX 1080 (8 GB) | ~45 s | ~90 s |
| GTX 1660 Super (6 GB) | ~60 s | ~2 min |
| RTX 3070+ | ~15 s | ~30 s |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `numpy` install errors | You're on Python 3.13+. **Use 3.11 exactly.** |
| `ModuleNotFoundError: monai` | Wrong Python/venv. Activate the correct env. |
| Empty model dropdown | `integrative-project/checkpoints/` must exist with `.pth` files |
| `CUDA out of memory` | Use a lighter model (`unet_flair`), or reduce `sw_batch_size` in `configs/tuned.yaml` |
| GPU not detected | Update NVIDIA driver to 525+ and verify `torch.cuda.is_available()` |
| Port 8000/3000 in use | Kill existing processes or change ports in `.env` |
| `.env` missing | `cp .env.example .env` (auto-done by `start.ps1`) |

---

## Tested configurations

| OS | Python | PyTorch | GPU | Driver |
|----|--------|---------|-----|--------|
| Windows 11 | 3.11 | 2.3.1+cu121 | GTX 1080 (CUDA 12.1) | 527.x |
| Windows 11 | 3.11 | 2.3.1+cpu | CPU only | — |
| Docker (any OS) | 3.11-slim | CPU | — | — |
| Windows | 3.14 | — | — | ❌ breaks |
