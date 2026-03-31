# Automated Pull Request Feature — GitCompass

A fully working, AI-powered pull request creation system built into GitCompass. Give it a repository, two branch names, and it writes the PR title, description, and labels using Google Gemini — then opens the pull request directly on GitHub.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Starting the Project](#starting-the-project)
3. [First-Time GitHub Setup](#first-time-github-setup)
4. [Using the Feature (Website)](#using-the-feature-website)
5. [API Reference](#api-reference)
6. [Testing with Postman](#testing-with-postman)
7. [Architecture Overview](#architecture-overview)
8. [File Reference](#file-reference)
9. [Error Reference](#error-reference)
10. [Rate Limits](#rate-limits)
11. [Troubleshooting](#troubleshooting)

---

## How It Works

```
User fills form          Backend validates       GitHub API fetches
(owner, repo,      →     input, checks auth  →   diff between branches
 head, base)
                                                        ↓
 ←  GitHub creates PR  ←  Gemini generates title,
on screenPR link shown                               description, labels
```

**Step-by-step:**

1. User submits the Create PR form on `/ai` page (must be logged in)
2. Backend validates input (owner/repo/branch name format, length limits)
3. If no diff provided, backend fetches it from `GET /repos/{owner}/{repo}/compare/{base}...{head}` via GitHub API using the user's OAuth token
4. Diff is sent to the Python AI engine (`POST /api/ai/generate-pr`)
5. Google Gemini 2.5 Flash analyzes the diff and returns a structured JSON:
   ```json
   { "title", "description", "labels", "breakingChanges", "summary" }
   ```
6. Backend calls `POST /repos/{owner}/{repo}/pulls` on GitHub using the user's stored OAuth token
7. AI-generated labels are applied to the newly created PR via `POST /repos/{owner}/{repo}/issues/{number}/labels`
8. The PR URL, number, title, description, labels, and summary are returned to the frontend
9. User sees a green success banner with a "View on GitHub" link

---

## Starting the Project

Three services must run simultaneously. Open **three separate terminals**.

### Terminal 1 — Node.js Backend

```bash
cd backend
npm install        # only needed first time
npm run dev
```

Runs on: `http://localhost:8080`

### Terminal 2 — Python AI Engine

```bash
cd ai-engine

# Create virtual environment (first time only)
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt   # only needed first time

python main.py
```

Runs on: `http://localhost:8000`

> **Note:** The AI engine also downloads an NLP model (~90 MB) on first run. This is normal.

### Terminal 3 — React Frontend

```bash
cd frontend
npm install        # only needed first time
npm run dev
```

Runs on: `http://localhost:5173`

### Verify Everything Is Running

Open these URLs in your browser:

| URL | Expected |
|-----|----------|
| `http://localhost:8080/api/health` | `{"status":"ok"}` |
| `http://localhost:8000/health` | `{"status":"ok"}` |
| `http://localhost:5173` | GitCompass home page |

---

## First-Time GitHub Setup

The Create PR feature requires a GitHub OAuth App with `repo` scope.

### 1. Create a GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** GitCompass (or anything)
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:8080/api/auth/github/callback`
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Set Environment Variables

Edit `backend/.env`:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
```

Edit `ai-engine/.env` (create it if it doesn't exist):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a Gemini API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) — it's free.

### 3. Re-login to Get `repo` Scope

The OAuth scope was updated to include `repo`. **Existing logged-in users must log out and log in again** so their stored access token includes write-access scope. First-time logins automatically get the right scope.

---

## Using the Feature (Website)

### Step 1 — Log in

Click **Login with GitHub** in the navbar. Authorize the app. You will be redirected back to GitCompass.

### Step 2 — Prepare Your Repository

You need a GitHub repository with **two diverging branches**. The head branch must have at least one commit that is not on the base branch.

Quick example to set up a test scenario:

```bash
# In your repository directory
git checkout -b feature/test-pr
echo "console.log('hello');" >> test.js
git add test.js
git commit -m "Add test.js"
git push origin feature/test-pr
```

### Step 3 — Open the Create PR Tab

1. Click **AI** in the navbar (or navigate to `/ai`)
2. Click the **Create PR** tab (4th tab with a merge icon)

### Step 4 — Fill in the Form

| Field | Required | Example |
|-------|----------|---------|
| Repository owner | Yes | `octocat` |
| Repository name | Yes | `my-project` |
| Head branch | Yes | `feature/test-pr` |
| Base branch | No (default: `main`) | `main` |
| Diff / code changes | No | Paste `git diff` output |
| Additional context | No | `This fixes the login bug` |

> **Tip:** Leave the diff blank. The backend automatically fetches it from GitHub using your logged-in token.

### Step 5 — Click "Create Pull Request on GitHub"

Processing takes 5–15 seconds (GitHub API fetch + Gemini generation + PR creation).

### Step 6 — See the Result

A green banner appears with:
- PR number (`#42`)
- **"View on GitHub"** button that opens the PR
- AI-generated title
- AI-generated full description (markdown)
- Labels applied (e.g., `feature`, `bug`)
- One-line summary

---

## API Reference

### `POST /api/ai/create-pr`

Creates a pull request on GitHub with AI-generated title and description.

**Authentication:** Required (session cookie from GitHub OAuth login)

**Request Body:**

```json
{
  "owner": "string, required — GitHub username or org",
  "repo": "string, required — repository name",
  "head": "string, required — source branch to merge from",
  "base": "string, optional — target branch (default: main)",
  "diff": "string, optional — raw git diff (auto-fetched if omitted)",
  "changes": "string, optional — alias for diff",
  "additionalContext": "string, optional — extra context for AI (max 2000 chars)"
}
```

**Validation rules:**
- `owner`: alphanumeric + `-._`, max 39 chars
- `repo`: alphanumeric + `-._`, max 100 chars
- `head` / `base`: alphanumeric + `-._/`, max 255 chars
- `diff` / `changes`: max 50,000 chars

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "prUrl": "https://github.com/owner/repo/pull/42",
    "prNumber": 42,
    "title": "Add JWT authentication middleware",
    "description": "## Summary\n\n...\n\n## Changes\n\n- ...",
    "labels": ["feature"],
    "summary": "Adds JWT-based authentication with login and logout routes.",
    "breakingChanges": false
  }
}
```

**Error Responses:**

| HTTP | `errorCode` | Cause |
|------|-------------|-------|
| 400 | — | Missing or invalid field |
| 401 | — | Not logged in, or token missing |
| 401 | `GITHUB_AUTH_FAILED` | GitHub token expired — re-login |
| 403 | `REPO_ACCESS_DENIED` | No write access to the repo |
| 404 | `REPO_NOT_FOUND` | Repo doesn't exist or is private |
| 404 | `REPO_OR_BRANCH_NOT_FOUND` | Branch name is wrong |
| 409 | `PR_ALREADY_EXISTS` | Open PR already exists for this branch |
| 422 | `NO_CHANGES` | No commits between base and head |
| 429 | `GITHUB_RATE_LIMIT` | GitHub API rate limit hit |
| 429 | — | Create-PR rate limiter (5 req/min per user) |
| 502 | `AI_SERVICE_UNAVAILABLE` | Python AI engine is down |
| 502 | `GITHUB_DIFF_FETCH_FAILED` | GitHub unreachable when fetching diff |
| 502 | `GITHUB_API_ERROR` | GitHub unreachable when creating PR |

---

### `POST /api/ai/generate-pr` (preview only)

Generates AI title + description from a diff but does **not** create a PR on GitHub. No auth required. Used by the "PR Generator" tab.

**Request Body:**

```json
{
  "diff": "string — raw git diff (required if owner/repo/head not given)",
  "owner": "string — optional, used to auto-fetch diff",
  "repo": "string — optional",
  "head": "string — optional",
  "base": "string — optional",
  "additionalContext": "string — optional"
}
```

**Response (200):** Same shape as `create-pr` response but without `prUrl` and `prNumber`.

---

## Testing with Postman

### Prerequisites

1. Log in on the website first (`http://localhost:5173`) to get a session cookie
2. In Postman: go to **Settings → Cookies** and make sure cookies are enabled for `localhost`
3. After logging in via browser, export your session cookie from browser DevTools (Application → Cookies → `connect.sid`) and add it to Postman

### Test 1 — Happy Path (Auto-fetch diff)

```
POST http://localhost:8080/api/ai/create-pr
Content-Type: application/json
Cookie: connect.sid=<your-session-cookie>

{
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "YOUR_REPO_NAME",
  "head": "feature/your-branch",
  "base": "main"
}
```

Expected: `201` with `prUrl`, `prNumber`, AI-generated `title` and `description`.

### Test 2 — With Explicit Diff

```
POST http://localhost:8080/api/ai/create-pr
Content-Type: application/json
Cookie: connect.sid=<your-session-cookie>

{
  "owner": "YOUR_USERNAME",
  "repo": "YOUR_REPO",
  "head": "feature/test",
  "base": "main",
  "diff": "diff --git a/test.js b/test.js\nindex 0000000..abc1234 100644\n--- /dev/null\n+++ b/test.js\n@@ -0,0 +1,3 @@\n+function greet(name) {\n+  return `Hello, ${name}`;\n+}",
  "additionalContext": "Adds a greeting utility function"
}
```

### Test 3 — Not Authenticated (should 401)

```
POST http://localhost:8080/api/ai/create-pr
Content-Type: application/json

{
  "owner": "test",
  "repo": "test",
  "head": "feature/x"
}
```

Expected: `401 Authentication required.`

### Test 4 — Invalid Branch Name (should 400)

```json
{
  "owner": "user",
  "repo": "repo",
  "head": "../../../etc/passwd"
}
```

Expected: `400 Invalid "head".`

### Test 5 — PR Already Exists (should 409)

Run Test 1 twice with the same branch. The second call should return:

```json
{
  "success": false,
  "message": "A pull request already exists for this head branch.",
  "errorCode": "PR_ALREADY_EXISTS"
}
```

---

## Architecture Overview

```
frontend/src/
  pages/
    AIBotPage.jsx          ← "Create PR" tab (4th tab), CreatePRResult component
  api/
    axios.js               ← aiAPI.createPR() → POST /api/ai/create-pr

backend/src/
  routes/
    ai.routes.js           ← POST /create-pr (isAuthenticated + createPrLimiter)
  services/
    ai.service.js          ← createPullRequest() orchestrator
                               ├── fetchGitHubDiff()
                               ├── generatePR() → AI engine
                               ├── createGitHubPR() → github.com API
                               └── applyLabelsToGitHubPR() → github.com API
  config/
    passport.js            ← GitHub OAuth with 'repo' scope

ai-engine/
  main.py                  ← POST /api/ai/generate-pr endpoint
  services/
    pr_generator.py        ← PRGenerator class (Gemini 2.5 Flash)
```

### Data Flow Diagram

```
Browser (React)
  └─POST /api/ai/create-pr ──────────────────────────────────► Node Backend :8080
                                                                  │
                             ┌──────────────────────────────────-┤
                             │  1. Validate input                 │
                             │  2. Check isAuthenticated          │
                             │  3. fetchGitHubDiff() [if no diff] │──► GitHub API
                             │  4. generatePR()                   │──► AI Engine :8000
                             │  5. createGitHubPR()               │──► GitHub API
                             │  6. applyLabelsToGitHubPR()        │──► GitHub API
                             └───────────────────────────────────-┘
                                                                  │
  201 { prUrl, prNumber, title, description, labels } ◄──────────┘
```

---

## File Reference

| File | Role |
|------|------|
| [backend/src/routes/ai.routes.js](backend/src/routes/ai.routes.js) | Express route: `POST /api/ai/create-pr` — validates input, checks auth, calls service |
| [backend/src/services/ai.service.js](backend/src/services/ai.service.js) | `createPullRequest()` orchestrator, `createGitHubPR()`, `fetchGitHubDiff()`, `applyLabelsToGitHubPR()` |
| [backend/src/config/passport.js](backend/src/config/passport.js) | GitHub OAuth with `repo` scope — allows creating PRs |
| [backend/src/middleware/auth.middleware.js](backend/src/middleware/auth.middleware.js) | `isAuthenticated` guard used on the create-pr route |
| [backend/src/models/User.model.js](backend/src/models/User.model.js) | `accessToken` field — stores GitHub OAuth token per user |
| [ai-engine/main.py](ai-engine/main.py) | FastAPI endpoint: `POST /api/ai/generate-pr` |
| [ai-engine/services/pr_generator.py](ai-engine/services/pr_generator.py) | `PRGenerator` class — prompts Gemini, parses JSON output |
| [frontend/src/pages/AIBotPage.jsx](frontend/src/pages/AIBotPage.jsx) | "Create PR" tab UI, form, result component |
| [frontend/src/api/axios.js](frontend/src/api/axios.js) | `aiAPI.createPR()` — frontend HTTP call |

---

## Error Reference

| Scenario | HTTP | What to Do |
|----------|------|------------|
| "Authentication required" | 401 | Log in via the GitHub button in the navbar |
| "GitHub token is invalid or expired" | 401 | Log out → log back in |
| "You do not have permission to create PRs" | 403 | You need **write access** (push permission) to the repo. Fork it or request collaborator access |
| "Repository not found" | 404 | Check `owner` and `repo` spelling. For private repos, your account must have access |
| "Branch not found" | 404 | Check the `head` branch name — run `git branch -r` in your repo to verify |
| "A pull request already exists" | 409 | The branch already has an open PR. Check your repo's Pull Requests tab |
| "No commits between..." | 422 | The head branch has no new commits vs base. Make a commit and push first |
| "Diff/changes is too large" | 400 | Split your work into smaller PRs |
| "AI service unavailable" | 502 | Start the AI engine: `cd ai-engine && python main.py` |

---

## Rate Limits

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/ai/create-pr` | **5 requests / minute** | Per logged-in user ID |
| `POST /api/ai/explain` | 20 requests / minute | Per IP address |
| `POST /api/ai/review` | 20 requests / minute | Per IP address |
| `POST /api/ai/generate-pr` | 20 requests / minute | Per IP address |
| GitHub API (all calls) | 5,000 requests / hour | Per OAuth token |
| Gemini API (free tier) | 15 requests / minute | Per API key |

---

## Troubleshooting

### "AI service unavailable" in the browser

The Python AI engine is not running. In a terminal:

```bash
cd ai-engine
.venv\Scripts\activate      # Windows
python main.py
```

### Labels not applied to the PR

Labels are applied on a best-effort basis. If a label (e.g., `feature`) does not exist in the repository, GitHub silently rejects it. Create the label manually in GitHub → Issues → Labels, or it will be skipped.

### PR is created but the description is generic ("Automated PR created by GitCompass")

The AI engine fell back to the default response. Check:

1. `GEMINI_API_KEY` is set correctly in `ai-engine/.env`
2. The AI engine is running and reachable at `http://localhost:8000`
3. The diff has actual content (at least a few lines of code changes)

### CORS error in browser console

Make sure the Vite dev server is running on port 5173 and the backend has `FRONTEND_URL=http://localhost:5173` in `backend/.env`.

### "No commits between..." but I pushed new code

GitHub's compare API may take a few seconds to see a fresh push. Wait a moment and try again.

### Session cookie lost / 401 after backend restart

Sessions are stored in memory by default. Restarting the backend clears all sessions — you need to log in again. For persistence, connect a MongoDB session store.
