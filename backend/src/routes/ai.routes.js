import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { optionalAuth, isAuthenticated } from '../middleware/auth.middleware.js';
import { explainCode, reviewCode, generatePR, createPullRequest } from '../services/ai.service.js';

const router = express.Router();

// 20 AI requests per minute per IP — LLM calls are expensive
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a moment and try again.' },
});

// Stricter limiter for PR creation — each call creates a real GitHub PR
const createPrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Prefer user ID (authenticated key); fall back to IPv6-safe IP key
    if (req.user?._id) return req.user._id.toString();
    return ipKeyGenerator(req);
  },
  message: { success: false, message: 'Too many PR creation requests. Please wait a moment and try again.' },
});

// aiRateLimiter is applied per-route to explain/review/generate-pr.
// /create-pr gets createPrLimiter only (stricter, user-keyed).

const MAX_CODE_LENGTH = 10000;

/**
 * Validate code input — shared by explain + review
 */
function validateCodeInput(req, res) {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      success: false,
      message: 'Request body must be JSON with Content-Type: application/json.',
    });
    return false;
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Code is required and must be a non-empty string.',
    });
    return false;
  }

  if (code.length > MAX_CODE_LENGTH) {
    res.status(400).json({
      success: false,
      message: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters.`,
    });
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────
// POST /api/ai/explain
// Explain a code snippet in simple natural language
// ─────────────────────────────────────────────
router.post('/explain', aiRateLimiter, optionalAuth, async (req, res) => {
  if (!validateCodeInput(req, res)) return;

  try {
    const { code, language, context } = req.body;

    const result = await explainCode({
      code: code.trim(),
      language: language || null,
      context: context || null,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('AI explain error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to explain code. Please try again.',
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/review
// Review code for bugs, issues, improvements
// ─────────────────────────────────────────────
router.post('/review', aiRateLimiter, optionalAuth, async (req, res) => {
  if (!validateCodeInput(req, res)) return;

  try {
    const { code, language, context } = req.body;

    const result = await reviewCode({
      code: code.trim(),
      language: language || null,
      context: context || null,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('AI review error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to review code. Please try again.',
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/generate-pr
// Generate PR title and description from a diff
// ─────────────────────────────────────────────
router.post('/generate-pr', aiRateLimiter, optionalAuth, async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Request body must be JSON with Content-Type: application/json.',
    });
  }

  try {
    const { diff, owner, repo, base, head, additionalContext } = req.body;

    if (!diff && !(owner && repo && head)) {
      return res.status(400).json({
        success: false,
        message: 'Provide either a "diff" string, or "owner", "repo", and "head" branch.',
      });
    }

    // Validate diff length if provided directly
    if (diff && typeof diff === 'string' && diff.length > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Diff is too large. Maximum 50,000 characters.',
      });
    }

    const accessToken = req.user?.accessToken || null;

    const result = await generatePR({
      diff: diff || null,
      owner,
      repo,
      base,
      head,
      additionalContext: additionalContext || null,
      accessToken,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('AI PR generation error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate PR description. Please try again.',
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/create-pr
// Generate PR title/description via AI, then create the PR on GitHub
// Requires authentication (user must have 'repo' OAuth scope)
// ─────────────────────────────────────────────
const OWNER_REPO_REGEX = /^[a-zA-Z0-9._-]+$/;
const BRANCH_REGEX = /^[a-zA-Z0-9._\-/]+$/;

router.post('/create-pr', isAuthenticated, createPrLimiter, async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Request body must be JSON with Content-Type: application/json.',
    });
  }

  const { owner, repo, head, base, changes, diff, additionalContext } = req.body;

  // --- Input validation ---
  if (!owner || typeof owner !== 'string' || !OWNER_REPO_REGEX.test(owner) || owner.length > 39) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "owner". Must be a valid GitHub username/org (alphanumeric, hyphens, dots, underscores; max 39 chars).',
    });
  }

  if (!repo || typeof repo !== 'string' || !OWNER_REPO_REGEX.test(repo) || repo.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "repo". Must be a valid GitHub repository name (max 100 chars).',
    });
  }

  if (!head || typeof head !== 'string' || !BRANCH_REGEX.test(head) || head.length > 255) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "head". Must be a valid branch name (max 255 chars).',
    });
  }

  if (base && (typeof base !== 'string' || !BRANCH_REGEX.test(base) || base.length > 255)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "base". Must be a valid branch name (max 255 chars).',
    });
  }

  // Accept diff from either "diff" or "changes" field
  const rawDiff = diff || changes || null;

  if (rawDiff && typeof rawDiff === 'string' && rawDiff.length > 50000) {
    return res.status(400).json({
      success: false,
      message: 'Diff/changes is too large. Maximum 50,000 characters.',
    });
  }

  if (additionalContext && typeof additionalContext === 'string' && additionalContext.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Additional context is too long. Maximum 2,000 characters.',
    });
  }

  const accessToken = req.user?.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: 'GitHub access token not found. Please re-authenticate via GitHub OAuth.',
    });
  }

  try {
    const result = await createPullRequest({
      owner,
      repo,
      head,
      base: base || 'main',
      diff: rawDiff,
      additionalContext: additionalContext || null,
      accessToken,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Create PR error:', err);

    const status = err.status || 500;
    const message = err.message || 'Failed to create pull request. Please try again.';

    return res.status(status).json({
      success: false,
      message,
      ...(err.code && { errorCode: err.code }),
    });
  }
});

export default router;
