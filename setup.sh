#!/usr/bin/env bash
# GitCompass - One-Command Setup Script for Linux/macOS
# Run from the project root: ./setup.sh
# Prerequisites: Node.js 18+, Python 3.9+, Git

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   GitCompass - Project Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ─── 1. Check prerequisites ───────────────────────────────────────────────────

echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Node.js
if ! command -v node &>/dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed. Download from https://nodejs.org (v18+)${NC}"
    exit 1
fi
NODE_VER=$(node --version)
echo -e "  ${GREEN}Node.js $NODE_VER found${NC}"

# npm
if ! command -v npm &>/dev/null; then
    echo -e "${RED}ERROR: npm is not installed. It should come with Node.js.${NC}"
    exit 1
fi

# Python 3.9+
PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PY_VER=$("$cmd" --version 2>&1)
        if echo "$PY_VER" | grep -qE "Python 3\.(9|[1-9][0-9])"; then
            PYTHON_CMD="$cmd"
            echo -e "  ${GREEN}$PY_VER found${NC}"
            break
        fi
    fi
done
if [ -z "$PYTHON_CMD" ]; then
    echo -e "${RED}ERROR: Python 3.9+ is not installed. Download from https://python.org${NC}"
    exit 1
fi

# ─── 2. Copy environment files ────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}[2/6] Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    cp .env.docker.example .env
    echo -e "  ${GREEN}Created .env from .env.docker.example${NC}"
else
    echo -e "  ${GRAY}.env already exists, skipping${NC}"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "  ${GREEN}Created backend/.env from backend/.env.example${NC}"
else
    echo -e "  ${GRAY}backend/.env already exists, skipping${NC}"
fi

if [ ! -f "ai-engine/.env" ]; then
    cp ai-engine/.env.example ai-engine/.env
    echo -e "  ${GREEN}Created ai-engine/.env from ai-engine/.env.example${NC}"
else
    echo -e "  ${GRAY}ai-engine/.env already exists, skipping${NC}"
fi

# ─── 3. Install Node.js dependencies ─────────────────────────────────────────

echo ""
echo -e "${YELLOW}[3/6] Installing Node.js dependencies...${NC}"

echo "  Installing root dependencies..."
npm install --silent

echo "  Installing frontend dependencies..."
(cd frontend && npm install --silent)

echo "  Installing backend dependencies..."
(cd backend && npm install --silent)

echo -e "  ${GREEN}Node.js dependencies installed${NC}"

# ─── 4. Set up Python virtual environment ─────────────────────────────────────

echo ""
echo -e "${YELLOW}[4/6] Setting up Python virtual environment...${NC}"

if [ ! -d ".venv" ]; then
    $PYTHON_CMD -m venv .venv
    echo -e "  ${GREEN}Created .venv virtual environment${NC}"
else
    echo -e "  ${GRAY}.venv already exists, skipping creation${NC}"
fi

VENV_PYTHON=".venv/bin/python"
VENV_PIP=".venv/bin/pip"

if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}ERROR: Virtual environment creation failed.${NC}"
    exit 1
fi

# ─── 5. Install Python dependencies ──────────────────────────────────────────

echo ""
echo -e "${YELLOW}[5/6] Installing Python dependencies (this may take a few minutes)...${NC}"

$VENV_PIP install --upgrade pip --quiet
$VENV_PIP install -r ai-engine/requirements.txt
echo -e "  ${GREEN}Python dependencies installed${NC}"

# ─── 6. Download spaCy model ─────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}[6/6] Downloading spaCy English model...${NC}"

if $VENV_PYTHON -m spacy download en_core_web_sm --quiet; then
    echo -e "  ${GREEN}spaCy model downloaded${NC}"
else
    echo -e "  ${YELLOW}WARNING: spaCy model download failed. Run manually: .venv/bin/python -m spacy download en_core_web_sm${NC}"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Fill in your API keys in these files:${NC}"
echo "  - backend/.env  (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, MONGODB_URI)"
echo "  - ai-engine/.env  (GEMINI_API_KEY, GITHUB_TOKEN)"
echo ""
echo -e "${CYAN}To start the project, open 2 terminals and run:${NC}"
echo "  Terminal 1 (Frontend + Backend):  npm run dev"
echo "  Terminal 2 (AI Engine):           .venv/bin/python ai-engine/main.py"
echo ""
echo -e "${CYAN}Or run everything with Docker (requires Docker):${NC}"
echo "  docker compose up --build"
echo ""
