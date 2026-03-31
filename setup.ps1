# GitCompass - One-Command Setup Script for Windows
# Run from the project root: .\setup.ps1
# Prerequisites: Node.js 18+, Python 3.9+, Git

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GitCompass - Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── 1. Check prerequisites ───────────────────────────────────────────────────

Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Download from https://nodejs.org (v18+)" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "  Node.js $nodeVersion found" -ForegroundColor Green

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm is not installed. It should come with Node.js." -ForegroundColor Red
    exit 1
}

# Python
$pythonCmd = $null
foreach ($cmd in @("python", "python3")) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $version = & $cmd --version 2>&1
        if ($version -match "Python 3\.[9-9]|Python 3\.1[0-9]") {
            $pythonCmd = $cmd
            Write-Host "  $version found" -ForegroundColor Green
            break
        }
    }
}
if (-not $pythonCmd) {
    Write-Host "ERROR: Python 3.9+ is not installed. Download from https://python.org" -ForegroundColor Red
    exit 1
}

# ─── 2. Copy environment files ────────────────────────────────────────────────

Write-Host ""
Write-Host "[2/6] Setting up environment files..." -ForegroundColor Yellow

# Root .env (for docker-compose)
if (-not (Test-Path ".env")) {
    Copy-Item ".env.docker.example" ".env"
    Write-Host "  Created .env from .env.docker.example" -ForegroundColor Green
} else {
    Write-Host "  .env already exists, skipping" -ForegroundColor Gray
}

# Backend .env
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "  Created backend\.env from backend\.env.example" -ForegroundColor Green
} else {
    Write-Host "  backend\.env already exists, skipping" -ForegroundColor Gray
}

# AI Engine .env
if (-not (Test-Path "ai-engine\.env")) {
    Copy-Item "ai-engine\.env.example" "ai-engine\.env"
    Write-Host "  Created ai-engine\.env from ai-engine\.env.example" -ForegroundColor Green
} else {
    Write-Host "  ai-engine\.env already exists, skipping" -ForegroundColor Gray
}

# ─── 3. Install Node.js dependencies ─────────────────────────────────────────

Write-Host ""
Write-Host "[3/6] Installing Node.js dependencies..." -ForegroundColor Yellow

Write-Host "  Installing root dependencies..."
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install failed at root" -ForegroundColor Red; exit 1 }

Write-Host "  Installing frontend dependencies..."
Set-Location frontend
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install failed in frontend" -ForegroundColor Red; exit 1 }
Set-Location ..

Write-Host "  Installing backend dependencies..."
Set-Location backend
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm install failed in backend" -ForegroundColor Red; exit 1 }
Set-Location ..

Write-Host "  Node.js dependencies installed" -ForegroundColor Green

# ─── 4. Set up Python virtual environment ─────────────────────────────────────

Write-Host ""
Write-Host "[4/6] Setting up Python virtual environment..." -ForegroundColor Yellow

if (-not (Test-Path ".venv")) {
    & $pythonCmd -m venv .venv
    Write-Host "  Created .venv virtual environment" -ForegroundColor Green
} else {
    Write-Host "  .venv already exists, skipping creation" -ForegroundColor Gray
}

$venvPython = ".\.venv\Scripts\python.exe"
$venvPip = ".\.venv\Scripts\pip.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment creation failed." -ForegroundColor Red
    exit 1
}

# ─── 5. Install Python dependencies ──────────────────────────────────────────

Write-Host ""
Write-Host "[5/6] Installing Python dependencies (this may take a few minutes)..." -ForegroundColor Yellow

& $venvPip install --upgrade pip --quiet
& $venvPip install -r ai-engine\requirements.txt
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pip install failed" -ForegroundColor Red; exit 1 }
Write-Host "  Python dependencies installed" -ForegroundColor Green

# ─── 6. Download spaCy model ─────────────────────────────────────────────────

Write-Host ""
Write-Host "[6/6] Downloading spaCy English model..." -ForegroundColor Yellow

& $venvPython -m spacy download en_core_web_sm --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: spaCy model download failed. Run manually: .venv\Scripts\python -m spacy download en_core_web_sm" -ForegroundColor DarkYellow
} else {
    Write-Host "  spaCy model downloaded" -ForegroundColor Green
}

# ─── Done ─────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Fill in your API keys in these files:" -ForegroundColor Yellow
Write-Host "  - backend\.env  (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, MONGODB_URI)" -ForegroundColor White
Write-Host "  - ai-engine\.env  (GEMINI_API_KEY, GITHUB_TOKEN)" -ForegroundColor White
Write-Host ""
Write-Host "To start the project, open 3 terminals and run:" -ForegroundColor Cyan
Write-Host "  Terminal 1 (Frontend + Backend):  npm run dev" -ForegroundColor White
Write-Host "  Terminal 2 (AI Engine):            .venv\Scripts\python.exe ai-engine\main.py" -ForegroundColor White
Write-Host ""
Write-Host "Or run everything with Docker (requires Docker Desktop):" -ForegroundColor Cyan
Write-Host "  docker compose up --build" -ForegroundColor White
Write-Host ""
