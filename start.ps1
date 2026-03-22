$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

Write-Host "Starting backend and frontend from $root"

if (-Not (Get-Command python -ErrorAction SilentlyContinue)) {
  throw "Python is not available on PATH. Install Python 3.11+ first."
}

if (-Not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available on PATH. Install Node.js 20+ first."
}

if (-Not (Test-Path $envFile) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envFile
  Write-Host "Created .env from .env.example"
}

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backend'; if (-Not (Test-Path '.venv')) { python -m venv .venv }; . .venv/Scripts/Activate.ps1; python -m ensurepip --upgrade; pip install -r requirements.txt; uvicorn main:app --host 0.0.0.0 --port 8000"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontend'; npm install; npm run dev"
)

Write-Host "Launched backend (8000) and frontend (3000)."
Write-Host "Open http://localhost:3000"
