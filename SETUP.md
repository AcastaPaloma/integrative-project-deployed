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

That's it. Backend on `:8000`, frontend on `:3000`. CPU-only inference.

---

## Option B: Conda (recommended for GPU)

```bash
# 1. Create conda env with Python 3.11 + CUDA PyTorch
cd integrative-project
conda env create -f environment.yml
conda activate gtx-1080-IP

# 2. Install webapp backend deps
cd ../integrative-project-deployed/backend
pip install -r requirements.txt

# 3. Install frontend deps
cd ../frontend
npm install

# 4. Run
cd ..
./start.ps1          # Windows PowerShell
# OR manually:
# Terminal 1: cd backend && uvicorn main:app --port 8000
# Terminal 2: cd frontend && npm run dev
```

> [!TIP]
> For GPU inference, verify CUDA is visible: `python -c "import torch; print(torch.cuda.is_available())"`

---

## Option C: Manual venv (no conda, CPU only)

```bash
# 1. Install Python 3.11 from python.org (NOT 3.12+, NOT 3.14!)
#    Check: python --version → 3.11.x

# 2. Backend
cd integrative-project-deployed/backend
python -m venv .venv

# Activate:
.venv\Scripts\Activate.ps1          # Windows PowerShell
# source .venv/bin/activate         # macOS/Linux

pip install -r requirements.txt

# 3. Frontend
cd ../frontend
npm install

# 4. Run
cd ..
./start.ps1
```

---

## After startup

1. Open **http://localhost:3000**
2. Click **New Case** → name it → create
3. Upload `.nii.gz` modality files (flair, t1, t1ce, t2)
4. Select a model → **Start inference**
5. Watch logs stream → viewer loads results when done

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `numpy` errors on install | You're on Python 3.13+. **Use Python 3.11.** |
| `ModuleNotFoundError: monai` | Wrong Python/venv. Activate the correct env. |
| Empty model dropdown | `integrative-project/checkpoints/` must exist with `.pth` files |
| Inference slow | CPU mode: 5-15 min per case. Use conda+CUDA for ~30s. |
| `CUDA out of memory` | Close other GPU apps, or use a lighter model like `unet_flair` |
| Port 8000/3000 in use | Kill existing processes or change ports in `.env` |
| `.env` missing | `cp .env.example .env` (auto-done by `start.ps1`) |

---

## Tested configurations

| OS | Python | Node | PyTorch | GPU | Status |
|----|--------|------|---------|-----|--------|
| Windows 11 | 3.11 | 20 | 2.3.1 | GTX 1080 (CUDA 12.1) | ✅ |
| Windows 11 | 3.11 | 20 | 2.3.1 | CPU only | ✅ (slow) |
| Docker (any OS) | 3.11-slim | 20 | CPU | CPU only | ✅ |
| Windows | 3.14 | — | — | — | ❌ numpy breaks |
