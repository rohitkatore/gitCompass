"""
Repository Health Analyzer
Generates AI-powered production-readiness verdicts for GitHub repositories
using Google Gemini with template fallback.
"""
import os
import json
import asyncio
from typing import Dict, Any


class RepoAnalyzer:
    """
    Analyze GitHub repository health metrics and produce a structured verdict.
    Uses Google Gemini when available; falls back to a deterministic template.
    """

    def __init__(self):
        self.gemini_model = None
        self._initialized = False

    def _setup_gemini(self):
        """Lazy-initialize the Gemini client."""
        if self._initialized:
            return
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
                print("RepoAnalyzer: Gemini initialized")
            else:
                print("RepoAnalyzer: GEMINI_API_KEY not set — using template verdicts")
        except ImportError:
            print("RepoAnalyzer: google-generativeai not installed — using template verdicts")
        except Exception as exc:
            print(f"RepoAnalyzer: Gemini setup failed — {exc}")
        finally:
            self._initialized = True

    async def analyze(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a production-readiness verdict for the given repository metrics.

        Expected keys in `metrics`:
            owner, repo, maintenanceScore, lastCommitDate, recentCommits,
            avgPRDaysToMerge, issueClosureRate, diversityScore,
            totalContributors, vulnerabilityCount,
            licenseInfo: { spdxId, type }
        """
        self._setup_gemini()

        if not self.gemini_model:
            return self._template_verdict(metrics)

        prompt = self._build_prompt(metrics)

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.gemini_model.generate_content(prompt),
            )
            content = response.text.strip()

            # Strip markdown fences if present
            if content.startswith("```"):
                parts = content.split("```")
                content = parts[1] if len(parts) >= 2 else content
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()

            result = json.loads(content)
            # Validate required keys — fall back if malformed
            required = {"label", "explanation", "strengths", "concerns", "recommendation"}
            if not required.issubset(result):
                raise ValueError("Incomplete JSON from Gemini")
            return result

        except Exception as exc:
            print(f"RepoAnalyzer: Gemini generation failed — {exc}")
            return self._template_verdict(metrics)

    # ──────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────

    @staticmethod
    def _build_prompt(metrics: Dict[str, Any]) -> str:
        license_info = metrics.get("licenseInfo", {})
        return f"""You are a senior software engineering expert evaluating a GitHub repository for production readiness.

Analyze these metrics and produce a structured JSON assessment:

Repository: {metrics.get("owner")}/{metrics.get("repo")}
Maintenance Score: {metrics.get("maintenanceScore")}/100
Last Commit Date: {metrics.get("lastCommitDate")}
Recent Commits (last 30 days window): {metrics.get("recentCommits")}
Avg PR Days to Merge: {metrics.get("avgPRDaysToMerge")} days
Issue Closure Rate: {metrics.get("issueClosureRate")}%
Contributor Diversity Score: {metrics.get("diversityScore")}/100 (100 = perfectly even, 0 = single contributor)
Total Known Contributors: {metrics.get("totalContributors")}
Open Security Vulnerabilities: {metrics.get("vulnerabilityCount")}
License: {license_info.get("spdxId", "Unknown")} ({license_info.get("type", "unknown")})

Respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{{
    "label": "Production Ready" | "Moderate Maturity" | "Needs Evaluation",
    "explanation": "2-3 sentences summarising the overall health assessment",
    "strengths": ["specific strength 1", "specific strength 2"],
    "concerns": ["specific concern 1", "specific concern 2"],
    "recommendation": "One actionable sentence for a developer evaluating this dependency"
}}

Label criteria:
- "Production Ready"  → score ≥ 65, low vulnerabilities, active maintenance
- "Moderate Maturity" → score 35–64, some concerns but usable
- "Needs Evaluation"  → score < 35 or critical security/license issues

Be specific and reference actual metric values in your explanation."""

    @staticmethod
    def _template_verdict(metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic fallback when Gemini is unavailable."""
        score = metrics.get("maintenanceScore", 0)
        vuln_count = metrics.get("vulnerabilityCount", 0)
        license_info = metrics.get("licenseInfo", {})
        license_type = license_info.get("type", "unknown")
        spdx_id = license_info.get("spdxId", "Unknown")

        strengths: list = []
        concerns: list = []

        if score >= 65:
            label = "Production Ready"
            explanation = (
                f"This repository scores {score}/100 and demonstrates strong maintenance "
                "practices with recent activity and responsive maintainers. "
                "It is a reliable choice for production adoption."
            )
            strengths += ["Active maintenance with recent commits", "Responsive issue and PR management"]
        elif score >= 35:
            label = "Moderate Maturity"
            explanation = (
                f"This repository scores {score}/100 with moderate maintenance signals. "
                "It may be suitable for non-critical use but warrants ongoing monitoring."
            )
            strengths.append("Some active development present")
            concerns.append("Maintenance consistency could be improved")
        else:
            label = "Needs Evaluation"
            explanation = (
                f"This repository scores {score}/100 and shows limited recent activity. "
                "Significant evaluation is required before adopting it in production environments."
            )
            concerns += ["Low recent commit activity", "Long-term maintenance viability is uncertain"]

        if vuln_count > 0:
            suffix = "ies" if vuln_count > 1 else "y"
            concerns.append(f"{vuln_count} open security vulnerabilit{suffix} detected")

        if license_type == "copyleft":
            concerns.append(f"{spdx_id} is a copyleft license — may restrict proprietary use")
        elif license_type == "permissive":
            strengths.append(f"Permissive {spdx_id} license — freely usable in commercial projects")

        rec_map = {
            "Production Ready":  "Safe to adopt — conduct a standard security review and pin to a stable release.",
            "Moderate Maturity": "Suitable for non-critical usage — monitor the repository for continued activity.",
            "Needs Evaluation":  "Proceed with caution — consider alternatives or plan to fork and maintain independently.",
        }

        return {
            "label": label,
            "explanation": explanation,
            "strengths": strengths,
            "concerns": concerns,
            "recommendation": rec_map.get(label, "Evaluate carefully before adoption."),
        }
