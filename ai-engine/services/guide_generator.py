"""
Guide Generator Service (ContributionGuide in Class Diagram)
Generates AI-powered contribution guides using Google Gemini
"""
import os
from typing import Dict, List, Any, Optional
import asyncio


class GuideGenerator:
    """
    Generate personalized contribution guides using Google Gemini
    Maps to ContributionGuide class in UML diagram
    """
    
    def __init__(self):
        """Initialize the guide generator"""
        self.gemini_model = None
        self._initialized = False
        self.guideId = None
        self.issueId = None
        self.steps = []
    
    def _setup_gemini(self):
        """Setup Google Gemini client (lazy initialization)"""
        if self._initialized:
            return
        
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                # Use stable Gemini 2.0 Flash model
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                print("Google Gemini 2.0 Flash initialized")
            else:
                print("GEMINI_API_KEY not found. Using template guides.")
        except ImportError:
            print("google-generativeai package not installed. Using template guides.")
        except Exception as e:
            print(f"Error setting up Gemini: {e}")
        finally:
            self._initialized = True
    
    async def generateGuideUsingLLM(
        self,
        repository: Dict[str, Any],
        issue: Optional[Dict[str, Any]],
        user_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate guide using Google Gemini LLM (generateGuideUsingLLM in diagram)"""
        # Lazy initialize
        self._setup_gemini()
        
        if not self.gemini_model:
            return None
        
        # Format user skills
        skills_text = ", ".join([s.get("name", "") if isinstance(s, dict) else str(s) for s in user_skills[:10]])
        
        # Build issue context if available
        issue_context = ""
        if issue:
            issue_labels = ", ".join(issue.get("labels", []))
            issue_context = f"""
Specific Issue to Contribute:
- Issue Number: #{issue.get('number', 'N/A')}
- Issue Title: {issue.get('title', 'N/A')}
- Labels: {issue_labels if issue_labels else 'None'}
- Difficulty: {issue.get('difficulty', 'Unknown')}
- Comments: {issue.get('comments', 0)} comments
"""
        
        # Create prompt
        prompt = f"""You are a helpful open-source contribution mentor. Generate a personalized contribution guide for a developer who wants to contribute to a specific issue.

Repository: {repository.get('fullName', 'Unknown')}
Description: {repository.get('description', 'No description')}
Language: {repository.get('language', 'Unknown')}
Stars: {repository.get('stars', 0)}
Topics: {', '.join(repository.get('topics', [])[:5])}
{issue_context}
Developer's Skills: {skills_text if skills_text else 'Not specified'}

Please provide a JSON response with the following structure:
{{
    "summary": "A 2-3 sentence overview of this specific issue and why it's a good contribution opportunity",
    "issueAnalysis": {{
        "difficulty": "easy/medium/hard",
        "estimatedTime": "estimated time to complete",
        "skillsNeeded": ["skill1", "skill2"]
    }},
    "gettingStarted": ["Step 1 specific to this issue", "Step 2", ...],
    "codeConventions": ["Convention 1", "Convention 2", ...],
    "tips": ["Tip 1 specific to this issue", "Tip 2", ...]
}}

Make the guide SPECIFIC to this issue. Reference the issue number and title. Provide actionable steps. Respond ONLY with valid JSON, no markdown formatting."""

        try:
            # Run synchronously in executor since google-generativeai is sync
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.gemini_model.generate_content(prompt)
            )
            
            content = response.text
            
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            
            # Parse JSON response
            import json
            guide = json.loads(content)
            return guide
            
        except Exception as e:
            print(f"Error generating guide with Gemini: {e}")
            return None
    
    def _generate_template_guide(
        self,
        repository: Dict[str, Any],
        issue: Optional[Dict[str, Any]],
        user_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate a template-based guide when LLM is unavailable"""
        repo_name = repository.get("name", "this project")
        full_name = repository.get("fullName", "the repository")
        description = repository.get("description", "an open-source project")
        language = repository.get("language", "various languages")
        stars = repository.get("stars", 0)
        
        # Format stars nicely
        if stars >= 1000000:
            stars_text = f"{stars / 1000000:.1f}M"
        elif stars >= 1000:
            stars_text = f"{stars / 1000:.1f}K"
        else:
            stars_text = str(stars)
        
        # Issue-specific content
        if issue:
            issue_number = issue.get("number", "")
            issue_title = issue.get("title", "this issue")
            difficulty = issue.get("difficulty", "medium")
            labels = issue.get("labels", [])
            
            # Estimate time based on difficulty
            time_estimate = "1-3 hours" if difficulty == "easy" else "3-8 hours" if difficulty == "medium" else "1-3 days"
            
            return {
                "summary": f"Issue #{issue_number}: \"{issue_title}\" is {'a great first contribution opportunity' if 'good first issue' in labels else 'an opportunity to contribute'} to {full_name}. This {difficulty} difficulty issue has clear requirements and is actively maintained.",
                
                "issueAnalysis": {
                    "difficulty": difficulty,
                    "estimatedTime": time_estimate,
                    "labels": labels,
                    "skillsNeeded": [language] if language else []
                },
                
                "gettingStarted": [
                    f"Fork the repository to your GitHub account",
                    f"Clone your fork: `git clone https://github.com/YOUR_USERNAME/{repo_name}.git`",
                    f"Navigate to the project: `cd {repo_name}`",
                    "Read the README.md for setup instructions",
                    "Install dependencies as specified in the documentation",
                    f"Create a new branch: `git checkout -b fix/issue-{issue_number}`",
                    f"Read issue #{issue_number} thoroughly, including all comments",
                    "Understand the codebase structure before making changes",
                    "Make your changes addressing the specific issue requirements",
                    "Test your changes locally",
                    f"Commit with a clear message: `git commit -m 'Fix #{issue_number}: Brief description'`",
                    "Push to your fork: `git push origin fix/issue-{issue_number}`",
                    f"Open a Pull Request referencing #{issue_number}"
                ],
                
                "codeConventions": [
                    "Follow the existing code style in the project",
                    f"Use the project's preferred {language} conventions" if language else "Follow existing conventions",
                    "Write meaningful commit messages referencing the issue",
                    "Add tests for new features when applicable",
                    "Update documentation if you change functionality",
                    "Keep changes focused on the specific issue"
                ],
                
                "tips": [
                    f"Comment on issue #{issue_number} to let maintainers know you're working on it",
                    "Check if someone is already assigned or working on this issue",
                    "Ask questions in issue comments if requirements are unclear",
                    f"Reference #{issue_number} in your PR title and description",
                    "Be patient with maintainers - they are often volunteers",
                    "Request review from maintainers when your PR is ready"
                ],
                
                "resources": [
                    {
                        "title": f"View Issue #{issue_number}",
                        "url": f"https://github.com/{full_name}/issues/{issue_number}"
                    },
                    {
                        "title": "Repository README",
                        "url": f"https://github.com/{full_name}#readme"
                    },
                    {
                        "title": "GitHub Pull Request Guide",
                        "url": "https://docs.github.com/en/pull-requests"
                    }
                ]
            }
        
        # Generic guide if no issue specified
        return {
            "summary": f"{full_name} is {description}. With {stars_text} stars, it's a well-maintained project with an active community that welcomes new contributors.",
            
            "gettingStarted": [
                f"Fork the repository to your GitHub account",
                f"Clone your fork: `git clone https://github.com/YOUR_USERNAME/{repo_name}.git`",
                f"Navigate to the project: `cd {repo_name}`",
                "Read the README.md for setup instructions",
                "Install dependencies as specified in the documentation",
                "Create a new branch: `git checkout -b feature/your-feature-name`",
                "Make your changes following the project's coding standards",
                "Commit with a clear message: `git commit -m 'Add: brief description'`",
                "Push to your fork: `git push origin feature/your-feature-name`",
                "Open a Pull Request on the original repository"
            ],
            
            "recommendedIssue": {
                "title": "Look for issues labeled 'good first issue' or 'help wanted'",
                "reason": f"These issues are specifically marked by maintainers as suitable for newcomers. They typically have clear requirements and often include helpful context or mentorship from experienced contributors."
            },
            
            "codeConventions": [
                "Follow the existing code style in the project",
                f"Use the project's preferred {language} conventions",
                "Write meaningful commit messages",
                "Add tests for new features when applicable",
                "Update documentation if you change functionality",
                "Keep changes focused and atomic"
            ],
            
            "tips": [
                "Start by reading CONTRIBUTING.md if it exists",
                "Check if someone is already working on an issue before starting",
                "Ask questions in issue comments if requirements are unclear",
                "Start with documentation or test improvements if code changes seem daunting",
                "Be patient with maintainers - they are often volunteers",
                "Join the project's community channels (Discord, Slack) if available",
                "Celebrate your merged PRs, no matter how small!"
            ],
            
            "resources": [
                {
                    "title": "Repository README",
                    "url": f"https://github.com/{full_name}#readme"
                },
                {
                    "title": "Good First Issues",
                    "url": f"https://github.com/{full_name}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
                },
                {
                    "title": "GitHub Pull Request Guide",
                    "url": "https://docs.github.com/en/pull-requests"
                },
                {
                    "title": "Open Source Guide",
                    "url": "https://opensource.guide/how-to-contribute/"
                }
            ]
        }
    
    async def generate(
        self,
        repository: Dict[str, Any],
        issue: Optional[Dict[str, Any]] = None,
        user_skills: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a contribution guide for a repository/issue
        
        Args:
            repository: Repository metadata
            issue: Optional issue metadata for issue-specific guides
            user_skills: Optional list of user's skills
            user_id: Optional user ID for personalization
            
        Returns:
            Contribution guide dictionary
        """
        user_skills = user_skills or []
        
        # Store issue ID for getGuideSummary
        self.issueId = issue.get("number") if issue else None
        
        # Try LLM first (lazy load Gemini)
        self._setup_gemini()
        
        print(f"DEBUG: Gemini model available: {self.gemini_model is not None}", flush=True)
        print(f"DEBUG: Issue provided: {issue is not None}", flush=True)
        
        if self.gemini_model:
            print("DEBUG: Attempting to generate guide with Gemini...", flush=True)
            llm_guide = await self.generateGuideUsingLLM(repository, issue, user_skills)
            if llm_guide:
                print("DEBUG: Successfully generated guide with Gemini", flush=True)
                # Store steps for getGuideSummary
                self.steps = llm_guide.get("gettingStarted", [])
                
                # Add resources to LLM-generated guide
                full_name = repository.get("fullName", "")
                issue_number = issue.get("number", "") if issue else ""
                
                if issue:
                    llm_guide["resources"] = [
                        {
                            "title": f"View Issue #{issue_number}",
                            "url": f"https://github.com/{full_name}/issues/{issue_number}"
                        },
                        {
                            "title": "Repository README",
                            "url": f"https://github.com/{full_name}#readme"
                        }
                    ]
                else:
                    llm_guide["resources"] = [
                        {
                            "title": "Repository README",
                            "url": f"https://github.com/{full_name}#readme"
                        },
                        {
                            "title": "Good First Issues",
                            "url": f"https://github.com/{full_name}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
                        }
                    ]
                return llm_guide
            else:
                print("DEBUG: Gemini generation failed, using template", flush=True)
        else:
            print("DEBUG: Gemini model not available, using template", flush=True)
        
        # Fallback to template
        guide = self._generate_template_guide(repository, issue, user_skills)
        self.steps = guide.get("gettingStarted", [])
        return guide
    
    def getGuideSummary(self) -> Dict[str, Any]:
        """Get a summary of the generated guide (getGuideSummary in diagram)"""
        return {
            "guideId": self.guideId,
            "issueId": self.issueId,
            "stepsCount": len(self.steps),
            "steps": self.steps[:3] if self.steps else []  # First 3 steps as preview
        }
