import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT = 60000; // 60s for LLM calls

/**
 * Call the Python AI engine for code explanation
 */
export async function explainCode({ code, language, context }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/explain`,
      { code, language, context },
      { timeout: AI_TIMEOUT }
    );
    return response.data;
  } catch (err) {
    // Log full detail so Render logs show the real cause
    const detail = err.response?.data ?? err.code ?? err.message;
    console.error(`AI explain failed [${AI_SERVICE_URL}]:`, detail);
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }
}

/**
 * Call the Python AI engine for code review
 */
export async function reviewCode({ code, language, context }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/review`,
      { code, language, context },
      { timeout: AI_TIMEOUT }
    );
    return response.data;
  } catch (err) {
    console.error('AI review service error:', err.message);
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }
}

/**
 * Fetch diff from GitHub and generate PR title/description via AI engine
 */
export async function generatePR({ diff, owner, repo, base, head, additionalContext, accessToken }) {
  let diffText = diff;

  // If no diff provided but owner/repo/head given, fetch from GitHub
  if (!diffText && owner && repo && head) {
    diffText = await fetchGitHubDiff({ owner, repo, base, head, accessToken });
  }

  if (!diffText) {
    throw new Error('No diff content available. Provide a diff or valid repo/branch info.');
  }

  // Truncate very large diffs to avoid token limits
  const MAX_DIFF_LENGTH = 15000;
  if (diffText.length > MAX_DIFF_LENGTH) {
    diffText = diffText.substring(0, MAX_DIFF_LENGTH) + '\n\n... [diff truncated for AI processing]';
  }

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/generate-pr`,
      { diff: diffText, additionalContext },
      { timeout: AI_TIMEOUT }
    );
    return response.data;
  } catch (err) {
    console.error('AI PR generation service error:', err.message);
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }
}

/**
 * Encode a branch/ref name for use in a URL path segment.
 * Preserves "/" so that branch names like "feature/my-thing" stay valid in
 * GitHub's compare API, while encoding all other special characters.
 */
function encodeBranchForUrl(branch) {
  return branch.split('/').map(encodeURIComponent).join('/');
}

/**
 * Fetch diff between two refs from GitHub API.
 * Throws a structured error with .code and .status on failure.
 */
async function fetchGitHubDiff({ owner, repo, base, head, accessToken }) {
  const baseBranch = base || 'main';
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${encodeBranchForUrl(baseBranch)}...${encodeBranchForUrl(head)}`;

  const headers = {
    Accept: 'application/vnd.github.v3.diff',
    'User-Agent': 'GitCompass',
  };

  if (accessToken) {
    headers.Authorization = `token ${accessToken}`;
  }

  try {
    const response = await axios.get(url, { headers, timeout: 15000 });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    console.error(`GitHub diff fetch failed [${status ?? 'network'}]: ${err.message}`);

    if (status === 404) {
      const error = new Error(`Repository ${owner}/${repo} or branch "${head}" not found.`);
      error.code = 'REPO_OR_BRANCH_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    if (status === 401) {
      const error = new Error('GitHub token is invalid or expired. Please log out and log in again.');
      error.code = 'GITHUB_AUTH_FAILED';
      error.status = 401;
      throw error;
    }
    if (status === 403) {
      if (err.response?.headers?.['x-ratelimit-remaining'] === '0') {
        const error = new Error('GitHub API rate limit exceeded. Please try again later.');
        error.code = 'GITHUB_RATE_LIMIT';
        error.status = 429;
        throw error;
      }
      const error = new Error(`You do not have read access to ${owner}/${repo}.`);
      error.code = 'REPO_ACCESS_DENIED';
      error.status = 403;
      throw error;
    }
    // Network errors, timeouts, 5xx from GitHub
    const error = new Error('Failed to fetch diff from GitHub. Check connectivity and repository details.');
    error.code = 'GITHUB_DIFF_FETCH_FAILED';
    error.status = 502;
    throw error;
  }
}

/**
 * Apply labels to an existing GitHub PR/issue (best-effort — silently ignores
 * labels that don't yet exist in the repo).
 */
async function applyLabelsToGitHubPR({ owner, repo, prNumber, labels, accessToken }) {
  if (!labels || labels.length === 0) return;

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${prNumber}/labels`;

  try {
    await axios.post(
      url,
      { labels },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitCompass',
        },
        timeout: 10000,
      }
    );
    console.log(`[create-pr] Labels applied: ${labels.join(', ')}`);
  } catch (err) {
    // Non-fatal — PR already created; log and continue
    console.warn(`[create-pr] Label application failed (non-fatal): ${err.message}`);
  }
}

/**
 * Create a Pull Request on GitHub via their REST API.
 * Requires an accessToken with `repo` scope.
 */
async function createGitHubPR({ owner, repo, head, base, title, body, accessToken }) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`;

  try {
    const response = await axios.post(
      url,
      { title, body, head, base },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitCompass',
        },
        timeout: 15000,
      }
    );

    return {
      prUrl: response.data.html_url,
      prNumber: response.data.number,
      state: response.data.state,
    };
  } catch (err) {
    const status = err.response?.status;
    const ghMessage = err.response?.data?.message || '';
    const ghErrors = err.response?.data?.errors || [];

    console.error(`GitHub PR creation failed [${status}]: ${ghMessage}`, ghErrors);

    if (status === 422) {
      // GitHub returns 422 for "already exists" and "no commits between"
      if (ghMessage.includes('A pull request already exists') || ghErrors.some(e => e.message?.includes('already exists'))) {
        const error = new Error('A pull request already exists for this head branch.');
        error.code = 'PR_ALREADY_EXISTS';
        error.status = 409;
        throw error;
      }
      if (ghMessage.includes('No commits between') || ghMessage.includes('no changes')) {
        const error = new Error(`No commits between ${base} and ${head}.`);
        error.code = 'NO_CHANGES';
        error.status = 422;
        throw error;
      }
      const error = new Error(ghMessage || 'GitHub rejected the PR request.');
      error.code = 'GITHUB_VALIDATION_ERROR';
      error.status = 422;
      throw error;
    }

    if (status === 401) {
      const error = new Error('GitHub token is invalid or expired. Please log out and log in again.');
      error.code = 'GITHUB_AUTH_FAILED';
      error.status = 401;
      throw error;
    }

    if (status === 403) {
      // GitHub rate limit uses 403 with X-RateLimit-Remaining: 0
      if (err.response?.headers?.['x-ratelimit-remaining'] === '0') {
        const error = new Error('GitHub API rate limit exceeded. Please try again later.');
        error.code = 'GITHUB_RATE_LIMIT';
        error.status = 429;
        throw error;
      }
      const error = new Error('You do not have permission to create PRs in this repository. Ensure your GitHub account has write access and the OAuth token has the "repo" scope.');
      error.code = 'REPO_ACCESS_DENIED';
      error.status = 403;
      throw error;
    }

    if (status === 404) {
      // GitHub returns 404 (not 403) when the token lacks 'repo' scope for write operations.
      // Detect this by checking the X-OAuth-Scopes header from GitHub's response.
      const tokenScopes = err.response?.headers?.['x-oauth-scopes'] || '';
      if (tokenScopes && !tokenScopes.split(',').map(s => s.trim()).includes('repo')) {
        const error = new Error('Your GitHub token is missing the "repo" scope. Please log out and log in again to grant write access.');
        error.code = 'MISSING_REPO_SCOPE';
        error.status = 401;
        throw error;
      }
      const error = new Error(`Repository ${owner}/${repo} not found, or you don't have access.`);
      error.code = 'REPO_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const error = new Error('Failed to create pull request on GitHub.');
    error.code = 'GITHUB_API_ERROR';
    error.status = 502;
    throw error;
  }
}

/**
 * Full orchestrator: fetch diff → generate AI title/description → create PR on GitHub.
 */
export async function createPullRequest({ owner, repo, head, base, diff, additionalContext, accessToken }) {
  const baseBranch = base || 'main';

  console.log(`[create-pr] Starting PR creation: ${owner}/${repo} ${head} → ${baseBranch}`);

  // 1. Resolve diff
  let diffText = diff;
  if (!diffText) {
    console.log('[create-pr] No diff provided, fetching from GitHub...');
    // fetchGitHubDiff now throws structured errors — let them propagate directly
    // so the route handler maps them to the correct HTTP status.
    diffText = await fetchGitHubDiff({ owner, repo, base: baseBranch, head, accessToken });
  }

  if (!diffText || (typeof diffText === 'string' && diffText.trim().length === 0)) {
    const error = new Error(`No commits found between "${baseBranch}" and "${head}". Ensure the branches have diverged.`);
    error.code = 'NO_CHANGES';
    error.status = 422;
    throw error;
  }

  // 2. Generate PR metadata via AI engine
  console.log('[create-pr] Generating PR title & description via AI...');
  let aiResult;
  try {
    aiResult = await generatePR({
      diff: diffText,
      owner,
      repo,
      base: baseBranch,
      head,
      additionalContext,
      accessToken,
    });
  } catch (err) {
    console.error('[create-pr] AI generation failed:', err.message);
    const error = new Error('AI service is unavailable. Could not generate PR description.');
    error.code = 'AI_SERVICE_UNAVAILABLE';
    error.status = 502;
    throw error;
  }

  const prTitle = aiResult?.title || `Merge ${head} into ${baseBranch}`;
  const prBody = aiResult?.description || 'Automated PR created by GitCompass.';

  // 3. Create the PR on GitHub
  console.log(`[create-pr] Creating PR on GitHub: "${prTitle}"`);
  const ghResult = await createGitHubPR({
    owner,
    repo,
    head,
    base: baseBranch,
    title: prTitle,
    body: prBody,
    accessToken,
  });

  console.log(`[create-pr] PR created successfully: ${ghResult.prUrl}`);

  // 4. Apply AI-generated labels (best-effort — never blocks PR creation)
  const labels = aiResult?.labels || [];
  await applyLabelsToGitHubPR({ owner, repo, prNumber: ghResult.prNumber, labels, accessToken });

  return {
    prUrl: ghResult.prUrl,
    prNumber: ghResult.prNumber,
    title: prTitle,
    description: prBody,
    labels,
    summary: aiResult?.summary || '',
    breakingChanges: aiResult?.breakingChanges || false,
  };
}
