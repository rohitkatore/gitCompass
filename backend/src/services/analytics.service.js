import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Make a GitHub API request with proper auth headers.
 * @param {string} endpoint - Path after the base URL
 * @param {string|null} token - OAuth or PAT token
 * @param {string} accept - GitHub Accept header
 */
async function githubRequest(endpoint, token = null, accept = 'application/vnd.github.v3+json') {
  const headers = {
    Accept: accept,
    'User-Agent': 'GitCompass-App',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  } else if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return axios.get(`${GITHUB_API_URL}${endpoint}`, { headers, timeout: 10000 });
}

/**
 * Compute a 0–100 maintenance score from gathered metrics.
 *
 * Weighting:
 *   Last-commit recency  — 35 pts
 *   Issue closure rate   — 30 pts
 *   Avg PR merge time    — 20 pts
 *   Recent commit count  — 15 pts
 */
function computeMaintenanceScore({ lastCommitDate, issueClosureRate, avgPRDaysToMerge, recentCommits }) {
  let score = 0;
  const daysSince = Math.floor((Date.now() - new Date(lastCommitDate)) / 86_400_000);

  // Recency — 35 pts
  if (daysSince <= 7) score += 35;
  else if (daysSince <= 30) score += 25;
  else if (daysSince <= 90) score += 15;
  else if (daysSince <= 180) score += 8;

  // Issue closure rate — 30 pts
  score += Math.round(issueClosureRate * 30);

  // PR merge speed — 20 pts
  if (avgPRDaysToMerge <= 2) score += 20;
  else if (avgPRDaysToMerge <= 7) score += 15;
  else if (avgPRDaysToMerge <= 14) score += 10;
  else if (avgPRDaysToMerge <= 30) score += 5;

  // Activity — 15 pts
  if (recentCommits >= 30) score += 15;
  else if (recentCommits >= 15) score += 10;
  else if (recentCommits >= 5) score += 6;
  else if (recentCommits >= 1) score += 3;

  return Math.min(score, 100);
}

/**
 * SPDX license ID → compatibility metadata.
 */
const LICENSE_MAP = {
  'MIT':         { compatible: true,  type: 'permissive',    note: 'Very permissive — compatible with nearly all projects.' },
  'Apache-2.0':  { compatible: true,  type: 'permissive',    note: 'Permissive with explicit patent protection.' },
  'BSD-2-Clause':{ compatible: true,  type: 'permissive',    note: 'Simple permissive license.' },
  'BSD-3-Clause':{ compatible: true,  type: 'permissive',    note: 'Permissive with non-endorsement clause.' },
  'ISC':         { compatible: true,  type: 'permissive',    note: 'Functionally equivalent to MIT.' },
  'GPL-2.0':     { compatible: false, type: 'copyleft',      note: 'Copyleft — derivatives must remain GPL-2.0.' },
  'GPL-3.0':     { compatible: false, type: 'copyleft',      note: 'Strong copyleft — derivatives must be GPL-3.0.' },
  'GPL-2.0-only':{ compatible: false, type: 'copyleft',      note: 'Copyleft — derivatives must remain GPL-2.0.' },
  'GPL-3.0-only':{ compatible: false, type: 'copyleft',      note: 'Strong copyleft — derivatives must be GPL-3.0.' },
  'LGPL-2.1':    { compatible: true,  type: 'weak-copyleft', note: 'Weak copyleft — safe for dynamic linking.' },
  'LGPL-3.0':    { compatible: true,  type: 'weak-copyleft', note: 'Weak copyleft — safe for dynamic linking.' },
  'AGPL-3.0':    { compatible: false, type: 'copyleft',      note: 'Network copyleft — restricts SaaS usage.' },
  'MPL-2.0':     { compatible: true,  type: 'weak-copyleft', note: 'File-level copyleft, generally safe to use.' },
  'UNLICENSED':  { compatible: false, type: 'proprietary',   note: 'No license — all rights reserved by default.' },
  'NOASSERTION': { compatible: false, type: 'unknown',       note: 'License could not be identified.' },
};

/**
 * Fallback verdict used when the Python AI engine is unavailable.
 */
function fallbackVerdict({ maintenanceScore, vulnerabilityCount, licenseInfo }) {
  const strengths = [];
  const concerns = [];
  let label, explanation;

  if (maintenanceScore >= 65) {
    label = 'Production Ready';
    explanation = `This repository scores ${maintenanceScore}/100 and demonstrates strong maintenance practices with recent activity and responsive maintainers.`;
    strengths.push('Active maintenance with recent commits', 'Responsive issue and PR management');
  } else if (maintenanceScore >= 35) {
    label = 'Moderate Maturity';
    explanation = `This repository scores ${maintenanceScore}/100 with moderate maintenance signals. Suitable for non-critical use but warrants monitoring.`;
    strengths.push('Some active development');
    concerns.push('Maintenance consistency could be improved');
  } else {
    label = 'Needs Evaluation';
    explanation = `This repository scores ${maintenanceScore}/100 and shows limited recent activity. Significant evaluation is required before adopting in production.`;
    concerns.push('Low recent commit activity', 'Consider long-term maintenance viability');
  }

  if (vulnerabilityCount > 0) {
    concerns.push(`${vulnerabilityCount} open security vulnerabilit${vulnerabilityCount === 1 ? 'y' : 'ies'} detected`);
  }
  if (licenseInfo?.type === 'copyleft') {
    concerns.push(`${licenseInfo.spdxId} is a copyleft license — may restrict proprietary use`);
  } else if (licenseInfo?.type === 'permissive') {
    strengths.push(`Permissive ${licenseInfo.spdxId} license`);
  }

  const recMap = {
    'Production Ready':  'Safe to adopt — conduct a standard security review and pin to a stable release.',
    'Moderate Maturity': 'Suitable for non-critical usage — monitor the repository for continued activity.',
    'Needs Evaluation':  'Proceed with caution — consider alternatives or plan to fork and maintain independently.',
  };

  return { label, explanation, strengths, concerns, recommendation: recMap[label] ?? '' };
}

/**
 * Parse the total item count from a GitHub Link header (per_page=1 requests).
 * Returns the count of items in the response when no pagination header exists.
 */
function parseTotalFromLinkHeader(result) {
  if (result.status !== 'fulfilled') return 0;
  const link = result.value.headers?.link ?? '';
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (match) return parseInt(match[1], 10);
  return result.value.data.length;
}

/**
 * Fetch full Deep-Dive analytics for a GitHub repository.
 *
 * @param {string} owner     — Repository owner login
 * @param {string} repo      — Repository name
 * @param {string|null} userToken — Authenticated user's OAuth token (optional)
 * @returns {Promise<object>} Analytics payload
 */
export async function getRepoAnalytics(owner, repo, userToken = null) {
  const token = userToken || null;

  // Run all independent GitHub fetches in parallel — each fails independently
  const [
    commitsRes,
    contributorsRes,
    closedPRsRes,
    openIssuesRes,
    closedIssuesRes,
    licenseRes,
  ] = await Promise.allSettled([
    githubRequest(`/repos/${owner}/${repo}/commits?per_page=30`, token),
    githubRequest(`/repos/${owner}/${repo}/contributors?per_page=10&anon=false`, token),
    githubRequest(`/repos/${owner}/${repo}/pulls?state=closed&per_page=20&sort=updated`, token),
    githubRequest(`/repos/${owner}/${repo}/issues?state=open&per_page=1`, token),
    githubRequest(`/repos/${owner}/${repo}/issues?state=closed&per_page=1`, token),
    githubRequest(`/repos/${owner}/${repo}/license`, token),
  ]);

  // Dependency vulnerability alerts via Dependabot (requires security_events or admin scope)
  let vulnerabilities = [];
  let vulnPermissionRequired = false;
  try {
    const dependabotRes = await githubRequest(
      `/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=10`,
      token
    );
    vulnerabilities = (dependabotRes.data ?? []).map((alert) => ({
      id: alert.number,
      severity: alert.security_vulnerability?.severity ?? 'unknown',
      packageName: alert.security_vulnerability?.package?.name ?? 'Unknown',
      ecosystem: alert.security_vulnerability?.package?.ecosystem ?? 'Unknown',
      summary: alert.security_advisory?.summary ?? 'Security vulnerability detected',
      cvssScore: alert.security_advisory?.cvss?.score ?? null,
      url: alert.html_url,
    }));
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      vulnPermissionRequired = true;
    }
    // 404 means Dependabot disabled or no alerts — treat as empty
  }

  // ─── Commits ────────────────────────────────────────────────────────────────
  const commits = commitsRes.status === 'fulfilled' ? commitsRes.value.data : [];
  const lastCommitDate =
    commits[0]?.commit?.author?.date ??
    new Date(Date.now() - 365 * 86_400_000).toISOString();
  const recentCommits = commits.length;

  // ─── Contributors ────────────────────────────────────────────────────────────
  const rawContributors =
    contributorsRes.status === 'fulfilled' ? contributorsRes.value.data : [];
  const contributors = rawContributors.map((c) => ({
    login: c.login,
    avatarUrl: c.avatar_url,
    contributions: c.contributions,
    profileUrl: c.html_url,
  }));

  // Diversity score (inverted HHI): 100 = perfectly even; 0 = single contributor
  let diversityScore = 50;
  if (contributors.length > 1) {
    const total = contributors.reduce((s, c) => s + c.contributions, 0);
    const hhi = contributors.reduce((s, c) => s + (c.contributions / total) ** 2, 0);
    diversityScore = Math.round((1 - hhi) * 100);
  } else if (contributors.length === 1) {
    diversityScore = 0;
  }

  // ─── PR response time ────────────────────────────────────────────────────────
  const closedPRs = closedPRsRes.status === 'fulfilled' ? closedPRsRes.value.data : [];
  const mergedPRs = closedPRs.filter((pr) => pr.merged_at);
  let avgPRDaysToMerge = 30; // pessimistic default
  if (mergedPRs.length > 0) {
    const totalDays = mergedPRs.reduce(
      (s, pr) => s + (new Date(pr.merged_at) - new Date(pr.created_at)) / 86_400_000,
      0
    );
    avgPRDaysToMerge = totalDays / mergedPRs.length;
  }

  // ─── Issue closure rate ──────────────────────────────────────────────────────
  const openCount = parseTotalFromLinkHeader(openIssuesRes) || 1;
  const closedCount = parseTotalFromLinkHeader(closedIssuesRes) || 0;
  const issueClosureRate = closedCount / (closedCount + openCount);

  // ─── License ─────────────────────────────────────────────────────────────────
  let licenseInfo = {
    spdxId: 'NOASSERTION',
    name: 'No License',
    compatible: false,
    type: 'unknown',
    note: 'No license file found — all rights are reserved by default.',
  };
  if (licenseRes.status === 'fulfilled') {
    const spdxId = licenseRes.value.data.license?.spdx_id ?? 'NOASSERTION';
    const mapped = LICENSE_MAP[spdxId] ?? {
      compatible: null,
      type: 'unknown',
      note: 'License compatibility cannot be determined automatically.',
    };
    licenseInfo = {
      spdxId,
      name: licenseRes.value.data.license?.name ?? spdxId,
      ...mapped,
    };
  }

  // ─── Maintenance score ───────────────────────────────────────────────────────
  const maintenanceScore = computeMaintenanceScore({
    lastCommitDate,
    issueClosureRate,
    avgPRDaysToMerge,
    recentCommits,
  });

  // ─── AI verdict ──────────────────────────────────────────────────────────────
  let aiVerdict = null;
  try {
    const aiRes = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-repo`,
      {
        owner,
        repo,
        maintenanceScore,
        lastCommitDate,
        recentCommits,
        avgPRDaysToMerge: Math.round(avgPRDaysToMerge * 10) / 10,
        issueClosureRate: Math.round(issueClosureRate * 100),
        diversityScore,
        totalContributors: contributors.length,
        vulnerabilityCount: vulnerabilities.length,
        licenseInfo: { spdxId: licenseInfo.spdxId, type: licenseInfo.type },
      },
      { timeout: 60_000 }
    );
    aiVerdict = aiRes.data;
  } catch (err) {
    console.warn('[analytics] AI engine unavailable, using fallback verdict:', err.message);
    aiVerdict = fallbackVerdict({
      maintenanceScore,
      vulnerabilityCount: vulnerabilities.length,
      licenseInfo,
    });
  }

  return {
    maintenanceScore,
    maintenanceBreakdown: {
      lastCommitDate,
      recentCommits,
      avgPRDaysToMerge: Math.round(avgPRDaysToMerge * 10) / 10,
      issueClosureRate: Math.round(issueClosureRate * 100),
    },
    contributors,
    diversityScore,
    vulnerabilities,
    vulnPermissionRequired,
    licenseInfo,
    aiVerdict,
  };
}
