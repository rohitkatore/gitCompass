import express from 'express';
import axios from 'axios';
import Repository from '../models/Repository.model.js';
import { isAuthenticated, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

const GITHUB_API_URL = 'https://api.github.com';

// Helper function to make GitHub API requests
const githubRequest = async (endpoint, token = null) => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitCompass-App',
  };
  
  if (token) {
    headers.Authorization = `token ${token}`;
  } else if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  return axios.get(`${GITHUB_API_URL}${endpoint}`, { headers });
};

// @route   POST /api/repositories/search
// @desc    Search repositories based on query and filters
// @access  Public (with optional auth for personalized results)
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const {
      query,
      language,
      minStars,
      topic,
      sortBy = 'stars',
      page = 1,
      perPage = 20,
    } = req.body;

    // Build GitHub search query
    let searchQuery = query || '';
    
    if (language) {
      searchQuery += ` language:${language}`;
    }
    
    if (minStars) {
      searchQuery += ` stars:>=${minStars}`;
    }
    
    if (topic) {
      searchQuery += ` topic:${topic}`;
    }

    // Add good-first-issues filter for beginners
    searchQuery += ' good-first-issues:>0';

    const sortMap = {
      relevance: 'best-match',
      stars: 'stars',
      forks: 'forks',
      updated: 'updated',
    };

    const userToken = req.user?.accessToken;
    
    const response = await githubRequest(
      `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${sortMap[sortBy] || 'stars'}&order=desc&page=${page}&per_page=${perPage}`,
      userToken
    );

    const repositories = response.data.items.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics || [],
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      openIssuesCount: repo.open_issues_count,
    }));

    res.json({
      success: true,
      data: {
        repositories,
        totalCount: response.data.total_count,
        page,
        perPage,
        hasMore: response.data.total_count > page * perPage,
      },
    });
  } catch (error) {
    console.error('Repository search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search repositories',
      error: error.message,
    });
  }
});

// @route   GET /api/repositories/recommendations
// @desc    Get personalized repository recommendations
// @access  Private
router.get('/recommendations', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.skills || user.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No skills found. Please upload your resume first.',
      });
    }

    // Get top skills for search
    const topSkills = user.skills
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((s) => s.name);

    // Call AI service for semantic matching
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    console.log(`Calling AI service at ${AI_SERVICE_URL}/api/recommend with skills:`, topSkills);
    
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/recommend`,
        {
          skills: topSkills,
          userId: user._id,
        },
        { timeout: 120000 } // 120 second timeout (allows time for model loading)
      );

      console.log('AI service response received, recommendations count:', aiResponse.data.recommendations?.length);
      
      return res.json({
        success: true,
        data: aiResponse.data.recommendations,
      });
    } catch (aiError) {
      // Fallback to GitHub search if AI service is unavailable
      console.log('AI service error:', aiError.message);
      console.log('Falling back to GitHub search');
      
      const searchQuery = topSkills.join(' OR ') + ' good-first-issues:>0 stars:100..100000';
      
      const response = await githubRequest(
        `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=help-wanted-issues&order=desc&per_page=10`,
        user.accessToken
      );

      const repositories = response.data.items.map((repo, index) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url,
        },
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        updatedAt: repo.updated_at,
        matchScore: 85 - index * 5,
        matchReason: `Matches your ${topSkills[0]} skills`,
        goodFirstIssues: repo.open_issues_count,
        difficulty: repo.stargazers_count > 10000 ? 'Hard' : repo.stargazers_count > 2000 ? 'Medium' : 'Easy',
      }));

      return res.json({
        success: true,
        data: repositories,
      });
    }
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
    });
  }
});

// @route   GET /api/repositories/:owner/:repo
// @desc    Get repository details
// @access  Public
router.get('/:owner/:repo', optionalAuth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const userToken = req.user?.accessToken;

    // Fetch repository details
    const repoResponse = await githubRequest(`/repos/${owner}/${repo}`, userToken);
    const repoData = repoResponse.data;

    // Fetch good first issues
    const issuesResponse = await githubRequest(
      `/repos/${owner}/${repo}/issues?labels=good%20first%20issue&state=open&per_page=10`,
      userToken
    );

    const repository = {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      owner: {
        login: repoData.owner.login,
        avatarUrl: repoData.owner.avatar_url,
        type: repoData.owner.type,
      },
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      language: repoData.language,
      topics: repoData.topics || [],
      htmlUrl: repoData.html_url,
      homepage: repoData.homepage,
      openIssuesCount: repoData.open_issues_count,
      license: repoData.license?.name,
      defaultBranch: repoData.default_branch,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      pushedAt: repoData.pushed_at,
    };

    const issues = issuesResponse.data.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map((l) => ({ name: l.name, color: l.color })),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      comments: issue.comments,
      htmlUrl: issue.html_url,
      user: {
        login: issue.user.login,
        avatarUrl: issue.user.avatar_url,
      },
    }));

    res.json({
      success: true,
      data: {
        repository,
        issues,
      },
    });
  } catch (error) {
    console.error('Get repository error:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Repository not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get repository details',
    });
  }
});

// @route   GET /api/repositories/:owner/:repo/issues
// @desc    Get repository issues with filters
// @access  Public
router.get('/:owner/:repo/issues', optionalAuth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { label, state = 'open', page = 1, perPage = 20 } = req.query;
    const userToken = req.user?.accessToken;

    let endpoint = `/repos/${owner}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`;
    
    if (label) {
      endpoint += `&labels=${encodeURIComponent(label)}`;
    }

    const response = await githubRequest(endpoint, userToken);

    const issues = response.data.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body?.substring(0, 500),
      state: issue.state,
      labels: issue.labels.map((l) => ({ name: l.name, color: l.color })),
      createdAt: issue.created_at,
      comments: issue.comments,
      htmlUrl: issue.html_url,
    }));

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get issues',
    });
  }
});

// @route   GET /api/repositories/:owner/:repo/analytics
// @desc    Repository Deep-Dive Analytics — maintenance, contributor diversity,
//          dependency vulnerabilities, license, and AI verdict
// @access  Public (optional auth improves vulnerability data)
router.get('/:owner/:repo/analytics', optionalAuth, async (req, res) => {
  const { owner, repo } = req.params;
  const userToken = req.user?.accessToken;

  try {
    const [repoRes, commitsRes, prsRes, closedIssuesRes, contributorsRes, vulnsRes] =
      await Promise.allSettled([
        githubRequest(`/repos/${owner}/${repo}`, userToken),
        githubRequest(`/repos/${owner}/${repo}/commits?per_page=30`, userToken),
        githubRequest(`/repos/${owner}/${repo}/pulls?state=closed&per_page=20&sort=updated&direction=desc`, userToken),
        githubRequest(`/repos/${owner}/${repo}/issues?state=closed&per_page=20`, userToken),
        githubRequest(`/repos/${owner}/${repo}/contributors?per_page=10`, userToken),
        githubRequest(`/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=20`, userToken),
      ]);

    if (repoRes.status === 'rejected') {
      return res.status(404).json({ success: false, message: 'Repository not found' });
    }
    const repoData = repoRes.value.data;

    // ── Maintenance Score ──────────────────────────────────────────────────────
    const commits = commitsRes.status === 'fulfilled' ? commitsRes.value.data : [];
    const lastCommitDate = commits[0]?.commit?.author?.date || repoData.pushed_at;
    const recentCommits = commits.length;
    const daysSinceLastCommit = Math.floor(
      (Date.now() - new Date(lastCommitDate)) / 86400000
    );

    const prs = prsRes.status === 'fulfilled' ? prsRes.value.data : [];
    const mergedPRs = prs.filter((pr) => pr.merged_at);
    const avgPRDaysToMerge =
      mergedPRs.length > 0
        ? Math.round(
            mergedPRs.reduce((sum, pr) => {
              return sum + (new Date(pr.merged_at) - new Date(pr.created_at)) / 86400000;
            }, 0) / mergedPRs.length
          )
        : 30;

    const closedIssues = closedIssuesRes.status === 'fulfilled' ? closedIssuesRes.value.data : [];
    const issueClosureRate =
      repoData.open_issues_count + closedIssues.length > 0
        ? Math.round(
            (closedIssues.length / (closedIssues.length + repoData.open_issues_count)) * 100
          )
        : closedIssues.length > 0
        ? 100
        : 50;

    let maintenanceScore = 50;
    if (daysSinceLastCommit <= 7) maintenanceScore += 20;
    else if (daysSinceLastCommit <= 30) maintenanceScore += 10;
    else if (daysSinceLastCommit > 365) maintenanceScore -= 30;
    else if (daysSinceLastCommit > 90) maintenanceScore -= 15;

    if (recentCommits >= 20) maintenanceScore += 15;
    else if (recentCommits >= 10) maintenanceScore += 7;

    if (mergedPRs.length > 0) {
      if (avgPRDaysToMerge <= 3) maintenanceScore += 10;
      else if (avgPRDaysToMerge <= 14) maintenanceScore += 5;
      else if (avgPRDaysToMerge > 30) maintenanceScore -= 5;
    }

    if (issueClosureRate >= 80) maintenanceScore += 5;
    else if (issueClosureRate < 20) maintenanceScore -= 5;

    maintenanceScore = Math.max(0, Math.min(100, maintenanceScore));

    // ── Contributor Diversity ──────────────────────────────────────────────────
    const contributorData = contributorsRes.status === 'fulfilled' ? contributorsRes.value.data : [];
    const contributors = (Array.isArray(contributorData) ? contributorData : []).map((c) => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      contributions: c.contributions,
      profileUrl: `https://github.com/${c.login}`,
    }));

    let diversityScore = 50;
    if (contributors.length > 0) {
      const totalContribs = contributors.reduce((s, c) => s + c.contributions, 0);
      const topShare = totalContribs > 0 ? contributors[0].contributions / totalContribs : 1;
      if (topShare < 0.3) diversityScore = Math.min(100, 90 + contributors.length);
      else if (topShare < 0.5) diversityScore = Math.min(100, 70 + contributors.length * 2);
      else if (topShare < 0.7) diversityScore = Math.min(100, 50 + contributors.length);
      else diversityScore = Math.max(10, 30 - Math.max(0, 1 - contributors.length) * 10);
    }

    // ── Vulnerability Alerts ───────────────────────────────────────────────────
    let vulnerabilities = [];
    let vulnPermissionRequired = false;
    if (vulnsRes.status === 'rejected') {
      const status = vulnsRes.reason?.response?.status;
      vulnPermissionRequired = status === 403 || status === 404;
    } else {
      const vulnData = vulnsRes.value.data;
      if (Array.isArray(vulnData)) {
        vulnerabilities = vulnData.slice(0, 10).map((a) => ({
          id: a.number?.toString() || a.security_advisory?.ghsa_id,
          summary: a.security_advisory?.summary || 'Unknown vulnerability',
          severity: (a.security_advisory?.severity || 'unknown').toLowerCase(),
          packageName: a.dependency?.package?.name || 'unknown',
          ecosystem: a.dependency?.package?.ecosystem || 'unknown',
          cvssScore: a.security_advisory?.cvss?.score || null,
          url: a.security_advisory?.references?.[0]?.url || null,
        }));
      }
    }

    // ── License Compatibility ──────────────────────────────────────────────────
    const spdxId = repoData.license?.spdx_id;
    const PERMISSIVE = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense', '0BSD'];
    const COPYLEFT = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'GPL-2.0-only', 'GPL-3.0-only', 'AGPL-3.0-only'];
    const WEAK_COPYLEFT = ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EPL-1.0', 'EPL-2.0'];

    let licenseType = 'unknown';
    let licenseNote = 'No license detected. Usage rights are unclear — contact the maintainer before use.';
    let licenseCompatible = null;

    if (spdxId && spdxId !== 'NOASSERTION') {
      if (PERMISSIVE.includes(spdxId)) {
        licenseType = 'permissive';
        licenseNote = `${spdxId} is a permissive license. You can use, modify, and distribute this code with minimal restrictions.`;
        licenseCompatible = true;
      } else if (COPYLEFT.includes(spdxId)) {
        licenseType = 'copyleft';
        licenseNote = `${spdxId} is a copyleft license. Derivative works must be released under the same license.`;
        licenseCompatible = false;
      } else if (WEAK_COPYLEFT.includes(spdxId)) {
        licenseType = 'weak-copyleft';
        licenseNote = `${spdxId} is a weak copyleft license. You can link against this library in proprietary software, but modifications to the library itself must be open-sourced.`;
        licenseCompatible = null;
      } else {
        licenseType = 'unknown';
        licenseNote = `${spdxId} license detected. Review the full license text before use.`;
      }
    }

    const licenseInfo = {
      spdxId: spdxId || 'None',
      type: licenseType,
      note: licenseNote,
      compatible: licenseCompatible,
    };

    // ── AI Verdict (rule-based) ────────────────────────────────────────────────
    const strengths = [];
    const concerns = [];

    if (daysSinceLastCommit <= 30)
      strengths.push('Recently updated and actively maintained');
    else if (daysSinceLastCommit > 180)
      concerns.push('No commits in the last 6 months — may be unmaintained');

    if (recentCommits >= 15)
      strengths.push(`${recentCommits} recent commits show active development`);

    if (mergedPRs.length > 0 && avgPRDaysToMerge <= 7)
      strengths.push('Fast PR review turnaround (≤ 1 week)');
    else if (mergedPRs.length > 0 && avgPRDaysToMerge > 30)
      concerns.push('Slow PR response — PRs take over a month to merge on average');

    if (issueClosureRate >= 70)
      strengths.push(`${issueClosureRate}% issue closure rate shows responsive maintainers`);
    else if (issueClosureRate < 30)
      concerns.push(`Low issue closure rate (${issueClosureRate}%) — many issues may be stale`);

    if (!vulnPermissionRequired && vulnerabilities.length === 0)
      strengths.push('No known dependency vulnerabilities detected');
    else if (vulnerabilities.some((v) => ['critical', 'high'].includes(v.severity))) {
      const critCount = vulnerabilities.filter((v) => ['critical', 'high'].includes(v.severity)).length;
      concerns.push(`${critCount} critical/high severity vulnerabilities found`);
    }

    if (licenseType === 'permissive')
      strengths.push(`${spdxId} permissive license — easy to integrate`);
    else if (licenseType === 'copyleft')
      concerns.push(`${spdxId} copyleft license may restrict commercial use`);
    else if (licenseType === 'unknown')
      concerns.push('No license — legal usage rights are unclear');

    if (contributors.length >= 5)
      strengths.push(`${contributors.length}+ contributors — healthy, diverse community`);
    else if (contributors.length <= 1)
      concerns.push('Single maintainer — bus factor risk if maintainer becomes inactive');

    let verdictLabel, verdictExplanation;
    if (maintenanceScore >= 65 && concerns.length <= 1) {
      verdictLabel = 'Production Ready';
      verdictExplanation = `${repoData.full_name} shows strong maintenance signals with a health score of ${maintenanceScore}/100. It's actively developed, responsive to contributions, and well-suited for production use.`;
    } else if (maintenanceScore >= 35) {
      verdictLabel = 'Moderate Maturity';
      verdictExplanation = `${repoData.full_name} has moderate health (score: ${maintenanceScore}/100). It's generally usable but review the concerns below before adding it to critical systems.`;
    } else {
      verdictLabel = 'Needs Evaluation';
      verdictExplanation = `${repoData.full_name} shows lower maintenance activity (score: ${maintenanceScore}/100). Evaluate carefully before adopting — consider forking if this project is critical to you.`;
    }

    const recommendation =
      concerns.length === 0
        ? 'This repository looks healthy and is a great candidate for contributions or production use.'
        : `Key concerns to monitor: ${concerns.slice(0, 2).join('; ')}.`;

    return res.json({
      success: true,
      data: {
        maintenanceScore,
        maintenanceBreakdown: {
          lastCommitDate,
          recentCommits,
          avgPRDaysToMerge,
          issueClosureRate,
        },
        contributors,
        diversityScore,
        vulnerabilities,
        vulnPermissionRequired,
        licenseInfo,
        aiVerdict: {
          label: verdictLabel,
          explanation: verdictExplanation,
          strengths,
          concerns,
          recommendation,
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch repository analytics' });
  }
});

export default router;
