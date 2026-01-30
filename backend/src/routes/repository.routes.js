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
      
      const searchQuery = topSkills.join(' OR ') + ' good-first-issues:>0';
      
      const response = await githubRequest(
        `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`,
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
        matchScore: 95 - index * 5, // Simulated match score
        matchReason: `Matches your ${topSkills[0]} skills`,
        goodFirstIssues: Math.floor(Math.random() * 20) + 5,
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
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

export default router;
