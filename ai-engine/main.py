"""
GitCompass AI Engine
A Python microservice for NLP and AI-powered features
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import os
from dotenv import load_dotenv

# Import service modules
from services.resume_processor import ResumeProcessor
from services.skill_matcher import SkillMatcher
from services.guide_generator import GuideGenerator
from services.code_analyzer import CodeAnalyzer
from services.pr_generator import PRGenerator

# Load environment variables
load_dotenv()

# Initialize services (must be before lifespan which references them)
resume_processor = ResumeProcessor()
skill_matcher = SkillMatcher()
guide_generator = GuideGenerator()
code_analyzer = CodeAnalyzer()
pr_generator = PRGenerator()


async def _preload_models_background():
    """Load heavy ML models in a background thread to avoid blocking the event loop"""
    print("Preloading models in background...")
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, skill_matcher._load_model)
        print("✓ Models preloaded successfully")
    except Exception as e:
        print(f"⚠ Warning: Failed to preload models: {e}")
        print("Models will be loaded on first request")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start server immediately — do NOT preload models to avoid OOM on 512MB Render free tier.
    SentenceTransformer + PyTorch (~450MB peak) exceeds the limit and causes crash loops.
    Models load lazily on first recommendation request."""
    print("Starting AI Engine...")
    yield  # server binds port immediately, no model preloading


# Initialize FastAPI app
app = FastAPI(
    title="GitCompass AI Engine",
    description="AI-powered microservice for resume processing, skill extraction, and contribution guide generation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://localhost:5173",
    "https://gitcompass-backend.onrender.com",
    os.getenv("CLIENT_URL", ""),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class SkillItem(BaseModel):
    name: str
    confidence: float
    category: str


class ExtractSkillsResponse(BaseModel):
    skills: List[SkillItem]
    rawText: str


class RecommendRequest(BaseModel):
    skills: List[str]
    userId: Optional[str] = None


class RepositoryOwner(BaseModel):
    login: str
    avatarUrl: str


class RepositoryMatch(BaseModel):
    id: int
    name: str
    fullName: str
    description: Optional[str]
    stars: int
    forks: int
    language: Optional[str]
    topics: List[str]
    matchScore: float
    matchReason: str
    goodFirstIssues: int
    difficulty: str
    owner: RepositoryOwner


class RecommendResponse(BaseModel):
    recommendations: List[RepositoryMatch]


class GuideRequest(BaseModel):
    repository: dict
    issue: Optional[dict] = None
    userSkills: Optional[List[dict]] = []
    userId: Optional[str] = None


class GuideResponse(BaseModel):
    guide: dict


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "GitCompass AI Engine",
        "version": "1.0.0"
    }


# Extract skills from resume
@app.post("/api/extract-skills", response_model=ExtractSkillsResponse)
async def extract_skills(file: UploadFile = File(...)):
    """
    Extract technical skills from an uploaded resume file.
    Supports PDF, DOC, and DOCX formats.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF and DOC/DOCX are allowed."
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Process resume and extract skills
        result = resume_processor.process(content, file.filename)
        
        return ExtractSkillsResponse(
            skills=result["skills"],
            rawText=result["raw_text"]
        )
    except Exception as e:
        print(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Get repository recommendations
@app.post("/api/recommend", response_model=RecommendResponse)
async def get_recommendations(request: RecommendRequest):
    """
    Get personalized repository recommendations based on user skills.
    Uses semantic matching with Sentence-BERT embeddings.
    """
    print(f"DEBUG: /api/recommend called with skills: {request.skills}", flush=True)
    try:
        recommendations = await skill_matcher.match_repositories(
            skills=request.skills,
            user_id=request.userId
        )
        
        print(f"DEBUG: Returning {len(recommendations)} recommendations", flush=True)
        return RecommendResponse(recommendations=recommendations)
    except Exception as e:
        print(f"Error getting recommendations: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Generate contribution guide
@app.post("/api/generate-guide", response_model=GuideResponse)
async def generate_guide(request: GuideRequest):
    """
    Generate an AI-powered contribution guide for a specific issue/repository.
    Uses Google Gemini to create personalized guidance.
    """
    try:
        guide = await guide_generator.generate(
            repository=request.repository,
            issue=request.issue,
            user_skills=request.userSkills,
            user_id=request.userId
        )
        
        return GuideResponse(guide=guide)
    except Exception as e:
        print(f"Error generating guide: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Bot Pydantic models ──────────────────────────────

class AIExplainRequest(BaseModel):
    code: str
    language: Optional[str] = None
    context: Optional[str] = None


class AIReviewRequest(BaseModel):
    code: str
    language: Optional[str] = None
    context: Optional[str] = None


class AIGeneratePRRequest(BaseModel):
    diff: str
    additionalContext: Optional[str] = None


# ── AI Bot Endpoints ────────────────────────────────────

@app.post("/api/ai/explain")
async def ai_explain(request: AIExplainRequest):
    """Explain a code snippet in simple natural language using Gemini."""
    try:
        result = await code_analyzer.explain(
            code=request.code,
            language=request.language,
            context=request.context,
        )
        return result
    except Exception as e:
        print(f"Error in /api/ai/explain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/review")
async def ai_review(request: AIReviewRequest):
    """Review code for bugs, bad practices, and suggest improvements."""
    try:
        result = await code_analyzer.review(
            code=request.code,
            language=request.language,
            context=request.context,
        )
        return result
    except Exception as e:
        print(f"Error in /api/ai/review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-pr")
async def ai_generate_pr(request: AIGeneratePRRequest):
    """Generate a PR title and description from a code diff."""
    try:
        result = await pr_generator.generate(
            diff=request.diff,
            additional_context=request.additionalContext,
        )
        return result
    except Exception as e:
        print(f"Error in /api/ai/generate-pr: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import signal
    import socket
    import subprocess
    import sys

    port = int(os.getenv("PORT", 8000))

    # Free port if already in use (Windows stale-process fix)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", port)) == 0:
            print(f"Port {port} is in use — attempting to free it...")
            try:
                # Works on Windows; silent on Linux/Mac
                result = subprocess.run(
                    ["powershell", "-Command",
                     f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue "
                     f"| Select-Object -ExpandProperty OwningProcess "
                     f"| Sort-Object -Unique "
                     f"| ForEach-Object {{ Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }}"],
                    capture_output=True, text=True, timeout=10
                )
                import time; time.sleep(1)
                print(f"Port {port} freed.")
            except Exception as free_err:
                print(f"Could not free port {port} automatically: {free_err}")
                print("Please run:  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force")
                sys.exit(1)

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )
