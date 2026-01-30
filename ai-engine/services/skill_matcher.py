"""
Skill Matcher Service
Matches user skills with repositories using semantic similarity
"""
import os
from typing import List, Dict, Any, Optional
import asyncio
import aiohttp


class SkillMatcher:
    """
    Match user skills with GitHub repositories using semantic similarity
    """
    
    def __init__(self):
        """Initialize the skill matcher"""
        self.model = None
        self.github_token = os.getenv("GITHUB_TOKEN")
        self._model_loaded = False
    
    async def initialize(self):
        """Preload the Sentence-BERT model (called on startup)"""
        self._load_model()
    
    def _load_model(self):
        """Load Sentence-BERT model for semantic matching (lazy loading)"""
        if self._model_loaded:
            return
        
        try:
            from sentence_transformers import SentenceTransformer
            # Use a lightweight model for faster inference
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("Sentence-BERT model loaded successfully")
        except ImportError:
            print("sentence-transformers not installed. Using fallback matching.")
            self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
        finally:
            self._model_loaded = True
    
    def generateEmbeddings(self, text: str):
        """Generate embeddings for text using Sentence-BERT"""
        self._load_model()
        if self.model:
            return self.model.encode(text)
        return None
    
    def calculateSimilarity(self, skill_embedding, repo_embedding) -> float:
        """Compute cosine similarity between skill and repository embeddings"""
        try:
            import numpy as np
            
            # Compute cosine similarity manually to avoid sklearn import issues
            dot_product = np.dot(skill_embedding.flatten(), repo_embedding.flatten())
            norm1 = np.linalg.norm(skill_embedding)
            norm2 = np.linalg.norm(repo_embedding)
            
            if norm1 == 0 or norm2 == 0:
                return 0.5
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            print(f"Error computing similarity: {e}")
            return 0.5
    
    # Large organizations to exclude from recommendations
    EXCLUDED_ORGS = {
        'microsoft', 'google', 'facebook', 'meta', 'apple', 'amazon', 'aws',
        'netflix', 'uber', 'airbnb', 'twitter', 'x', 'linkedin', 'vercel',
        'mozilla', 'adobe', 'oracle', 'ibm', 'intel', 'nvidia', 'salesforce',
        'shopify', 'stripe', 'twilio', 'atlassian', 'hashicorp', 'elastic',
        'datadog', 'cloudflare', 'digitalocean', 'heroku', 'github', 'gitlab',
        'jetbrains', 'redhat', 'canonical', 'docker', 'kubernetes', 'apache',
        'nodejs', 'vuejs', 'angular', 'reactjs', 'sveltejs', 'tensorflow',
        'pytorch', 'huggingface', 'openai', 'anthropic', 'palantir', 'databricks',
        'snowflake', 'confluent', 'cockroachlabs', 'timescale', 'prisma',
        'supabase', 'planetscale', 'neon', 'turso', 'upstash'
    }
    
    def _is_individual_user(self, repo: Dict[str, Any]) -> bool:
        """Check if a repository is owned by an individual user (not a large org)"""
        owner = repo.get("owner", {})
        owner_login = owner.get("login", "").lower()
        owner_type = owner.get("type", "")
        
        # Exclude known large organizations
        if owner_login in self.EXCLUDED_ORGS:
            return False
        
        # Prefer User type over Organization type
        if owner_type == "User":
            return True
        
        # For organizations, check if it's a small org (not in excluded list)
        # Allow small orgs that might be individual projects
        return owner_type == "Organization" and owner_login not in self.EXCLUDED_ORGS
    
    async def _fetch_github_repos(self, skills: List[str]) -> List[Dict[str, Any]]:
        """Fetch repositories from GitHub based on skills"""
        print(f"DEBUG: Fetching GitHub repos for skills: {skills}", flush=True)
        
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitCompass-AI-Engine"
        }
        
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"
            print("DEBUG: Using GitHub token for API requests", flush=True)
        else:
            print("DEBUG: No GitHub token found, using unauthenticated requests", flush=True)
        
        # Build search query from skills - filter out empty/None skills
        valid_skills = [s for s in skills[:5] if s and isinstance(s, str)]
        if not valid_skills:
            print("DEBUG: No valid skills to search", flush=True)
            return []
            
        query = " OR ".join(valid_skills)
        query += " good-first-issues:>0"
        
        # Fetch more repos to have enough after filtering out large orgs
        url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=50"
        print(f"DEBUG: GitHub API URL: {url}", flush=True)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    print(f"DEBUG: GitHub API response status: {response.status}", flush=True)
                    if response.status == 200:
                        data = await response.json()
                        items = data.get("items", [])
                        print(f"DEBUG: Got {len(items)} repositories from GitHub", flush=True)
                        
                        # Filter to prefer individual users over large organizations
                        filtered_items = [repo for repo in items if self._is_individual_user(repo)]
                        print(f"DEBUG: After filtering orgs, {len(filtered_items)} repos remain", flush=True)
                        
                        # If we filtered too many, include some org repos but prioritize individuals
                        if len(filtered_items) < 10:
                            # Add back some org repos that aren't in the excluded list
                            remaining = [repo for repo in items if repo not in filtered_items]
                            filtered_items.extend(remaining[:10 - len(filtered_items)])
                        
                        return filtered_items
                    else:
                        error_text = await response.text()
                        print(f"GitHub API error: {response.status} - {error_text}", flush=True)
                        return []
        except Exception as e:
            print(f"Error fetching repositories: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return []
    
    def _create_repo_text(self, repo: Dict[str, Any]) -> str:
        """Create a text representation of a repository for embedding"""
        parts = [
            repo.get("name", ""),
            repo.get("description", "") or "",
            repo.get("language", "") or "",
            " ".join(repo.get("topics", []))
        ]
        return " ".join(filter(None, parts))
    
    def _classify_difficulty(self, repo: Dict[str, Any]) -> str:
        """Classify repository difficulty based on various factors"""
        stars = repo.get("stargazers_count", 0)
        forks = repo.get("forks_count", 0)
        issues = repo.get("open_issues_count", 0)
        
        # Simple heuristic for difficulty
        if stars > 50000 or forks > 10000:
            return "Hard"
        elif stars > 10000 or forks > 2000:
            return "Medium"
        else:
            return "Easy"
    
    def _generate_match_reason(self, skills: List[str], repo: Dict[str, Any]) -> str:
        """Generate a human-readable match reason"""
        repo_text = self._create_repo_text(repo).lower()
        # Filter out None/empty skills and convert to lowercase safely
        matched_skills = [s for s in skills if s and isinstance(s, str) and s.lower() in repo_text]
        
        if matched_skills:
            if len(matched_skills) == 1:
                return f"Matches your {matched_skills[0]} skills"
            else:
                return f"Matches your {', '.join(matched_skills[:2])} skills"
        
        # Fallback reasons
        lang = repo.get("language")
        if lang:
            return f"Uses {lang} which aligns with your profile"
        
        return "Good match based on your skill profile"
    
    def rankRepositories(self, repos: List[Dict[str, Any]], skills: List[str]) -> List[Dict[str, Any]]:
        """Rank repositories based on skill match scores"""
        if not self.model:
            return repos
        
        skill_text = " ".join(skills)
        skill_embedding = self.generateEmbeddings(skill_text)
        
        ranked = []
        for repo in repos:
            repo_text = self._create_repo_text(repo)
            repo_embedding = self.generateEmbeddings(repo_text)
            similarity = self.calculateSimilarity(skill_embedding, repo_embedding)
            ranked.append((repo, similarity))
        
        ranked.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in ranked]
    
    async def getTopRepositories(
        self,
        skills: List[str],
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get top matching repositories for user skills
        
        Args:
            skills: List of user's technical skills
            user_id: Optional user ID for personalization
            
        Returns:
            List of matched repositories with scores
        """
        print(f"DEBUG: getTopRepositories called with skills: {skills}", flush=True)
        
        if not skills:
            print("DEBUG: No skills provided, returning empty list", flush=True)
            return []
        
        # Lazy load model on first use
        self._load_model()
        
        # Fetch repositories from GitHub
        repos = await self._fetch_github_repos(skills)
        
        if not repos:
            # Return mock data if GitHub API fails
            print("DEBUG: No repos from GitHub API, returning mock recommendations", flush=True)
            return self._get_mock_recommendations(skills)
        
        print(f"DEBUG: Processing {len(repos)} repositories", flush=True)
        
        # Compute semantic matches if model is available
        recommendations = []
        
        if self.model:
            # Create skill embedding
            skill_text = " ".join(skills)
            skill_embedding = self.generateEmbeddings(skill_text)
            
            for repo in repos:
                repo_text = self._create_repo_text(repo)
                repo_embedding = self.generateEmbeddings(repo_text)
                
                similarity = self.calculateSimilarity(skill_embedding, repo_embedding)
                
                # Normalize to 0-100 score
                match_score = round(similarity * 100)
                
                # Boost score based on other factors - filter out None skills
                repo_lang = repo.get("language", "")
                if repo_lang and any(s and isinstance(s, str) and repo_lang.lower() == s.lower() for s in skills):
                    match_score = min(match_score + 10, 100)
                
                # Debug: print repo structure
                print(f"DEBUG: Processing repo {repo.get('name')}, has owner: {'owner' in repo}")
                if 'owner' in repo:
                    print(f"DEBUG: Owner keys: {list(repo['owner'].keys())}")
                
                try:
                    repo_data = {
                        "id": repo["id"],
                        "name": repo["name"],
                        "fullName": repo["full_name"],
                        "description": repo.get("description"),
                        "stars": repo["stargazers_count"],
                        "forks": repo["forks_count"],
                        "language": repo.get("language"),
                        "topics": repo.get("topics", [])[:5],
                        "matchScore": match_score,
                        "matchReason": self._generate_match_reason(skills, repo),
                        "goodFirstIssues": min(repo.get("open_issues_count", 0), 50),
                        "difficulty": self._classify_difficulty(repo),
                        "owner": {
                            "login": repo["owner"]["login"],
                            "avatarUrl": repo["owner"]["avatar_url"]
                        }
                    }
                    recommendations.append(repo_data)
                except (KeyError, TypeError) as e:
                    print(f"Error building repo data (model path): {e}")
                    print(f"Repo keys: {list(repo.keys()) if isinstance(repo, dict) else 'not a dict'}")
                    if isinstance(repo, dict) and 'owner' in repo:
                        print(f"Owner keys: {list(repo['owner'].keys()) if isinstance(repo['owner'], dict) else 'owner not a dict'}")
                    continue
        else:
            # Fallback: simple keyword matching
            for i, repo in enumerate(repos):
                repo_text = self._create_repo_text(repo).lower()
                # Filter out None/empty skills safely
                matched_count = sum(1 for s in skills if s and isinstance(s, str) and s.lower() in repo_text)
                match_score = min(95 - i * 3, 50 + matched_count * 10)
                
                try:
                    repo_data = {
                        "id": repo["id"],
                        "name": repo["name"],
                        "fullName": repo["full_name"],
                        "description": repo.get("description"),
                        "stars": repo["stargazers_count"],
                        "forks": repo["forks_count"],
                        "language": repo.get("language"),
                        "topics": repo.get("topics", [])[:5],
                        "matchScore": match_score,
                        "matchReason": self._generate_match_reason(skills, repo),
                        "goodFirstIssues": min(repo.get("open_issues_count", 0), 50),
                        "difficulty": self._classify_difficulty(repo),
                        "owner": {
                            "login": repo["owner"]["login"],
                            "avatarUrl": repo["owner"]["avatar_url"]
                        }
                    }
                    recommendations.append(repo_data)
                except (KeyError, TypeError) as e:
                    print(f"Error building repo data (fallback path): {e}")
                    print(f"Repo keys: {list(repo.keys()) if isinstance(repo, dict) else 'not a dict'}")
                    if isinstance(repo, dict) and 'owner' in repo:
                        print(f"Owner keys: {list(repo['owner'].keys()) if isinstance(repo['owner'], dict) else 'owner not a dict'}")
                    continue
        
        # Sort by match score
        recommendations.sort(key=lambda x: x["matchScore"], reverse=True)
        
        final_recs = recommendations[:10]
        print(f"DEBUG: Returning {len(final_recs)} recommendations", flush=True)
        if final_recs:
            print(f"DEBUG: First rec has owner: {'owner' in final_recs[0]}", flush=True)
            if 'owner' in final_recs[0]:
                print(f"DEBUG: First rec owner keys: {list(final_recs[0]['owner'].keys())}", flush=True)
        
        return final_recs
    
    def _get_mock_recommendations(self, skills: List[str]) -> List[Dict[str, Any]]:
        """Return mock recommendations for development/testing (individual developers)"""
        return [
            {
                "id": 1,
                "name": "30-seconds-of-code",
                "fullName": "Chalarangelo/30-seconds-of-code",
                "description": "Short code snippets for all your development needs",
                "stars": 120000,
                "forks": 12000,
                "language": "JavaScript",
                "topics": ["javascript", "snippets", "learning"],
                "matchScore": 95,
                "matchReason": f"Matches your {skills[0] if skills else 'JavaScript'} skills",
                "goodFirstIssues": 15,
                "difficulty": "Easy",
                "owner": {
                    "login": "Chalarangelo",
                    "avatarUrl": "https://github.com/Chalarangelo.png"
                }
            },
            {
                "id": 2,
                "name": "free-programming-books",
                "fullName": "EbookFoundation/free-programming-books",
                "description": "Freely available programming books",
                "stars": 310000,
                "forks": 58000,
                "language": "Markdown",
                "topics": ["books", "education", "programming"],
                "matchScore": 88,
                "matchReason": "Great for documentation contributions",
                "goodFirstIssues": 30,
                "difficulty": "Easy",
                "owner": {
                    "login": "EbookFoundation",
                    "avatarUrl": "https://github.com/EbookFoundation.png"
                }
            },
            {
                "id": 3,
                "name": "developer-roadmap",
                "fullName": "kamranahmedse/developer-roadmap",
                "description": "Interactive roadmaps, guides and educational content",
                "stars": 270000,
                "forks": 36000,
                "language": "TypeScript",
                "topics": ["roadmap", "learning", "developer"],
                "matchScore": 85,
                "matchReason": "Perfect for learning and contributing guides",
                "goodFirstIssues": 20,
                "difficulty": "Easy",
                "owner": {
                    "login": "kamranahmedse",
                    "avatarUrl": "https://github.com/kamranahmedse.png"
                }
            }
        ]
    
    # Alias for backward compatibility
    async def match_repositories(self, skills: List[str], user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Alias for getTopRepositories (backward compatibility)"""
        return await self.getTopRepositories(skills, user_id)
