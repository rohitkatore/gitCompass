"""
GitCompass AI Engine
A Python microservice for NLP and AI-powered features
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

# Import service modules
from services.resume_processor import ResumeProcessor
from services.skill_matcher import SkillMatcher
from services.guide_generator import GuideGenerator

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="GitCompass AI Engine",
    description="AI-powered microservice for resume processing, skill extraction, and contribution guide generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
resume_processor = ResumeProcessor()
skill_matcher = SkillMatcher()
guide_generator = GuideGenerator()


# Startup event to preload models
@app.on_event("startup")
async def startup_event():
    """Preload ML models on startup to avoid delays on first request"""
    print("Preloading models...")
    try:
        # Preload the Sentence-BERT model by initializing skill matcher
        await skill_matcher.initialize()
        print("✓ Models preloaded successfully")
    except Exception as e:
        print(f"⚠ Warning: Failed to preload models: {e}")
        print("Models will be loaded on first request")


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


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Disabled for Windows compatibility
    )
