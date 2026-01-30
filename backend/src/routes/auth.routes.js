import express from 'express';
import passport from 'passport';
import axios from 'axios';

const router = express.Router();

// @route   GET /api/auth/github
// @desc    Initiate GitHub OAuth
// @access  Public
router.get('/github', passport.authenticate('github', {
  scope: ['user:email', 'read:user'],
}));

// @route   GET /api/auth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`,
  }),
  (req, res) => {
    // Successful authentication
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

// @route   GET /api/auth/user
// @desc    Get current authenticated user
// @access  Private
router.get('/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      id: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
      company: req.user.company,
      location: req.user.location,
      profileUrl: req.user.profileUrl,
      publicRepos: req.user.publicRepos || 0,
      followers: req.user.followers || 0,
      following: req.user.following || 0,
      skills: req.user.skills || [],
      savedRepositories: req.user.savedRepositories || [],
      hasResume: !!req.user.resume?.uploadedAt,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
});

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Public
router.get('/check', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user._id,
      username: req.user.username,
    } : null,
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

// @route   GET /api/auth/contributions
// @desc    Get GitHub contribution data for the authenticated user
// @access  Private
router.get('/contributions', async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  try {
    const username = req.user.username;
    const accessToken = req.user.accessToken;

    // GitHub GraphQL query to fetch contribution data
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const response = await axios.post(
      'https://api.github.com/graphql',
      {
        query,
        variables: { username },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const contributionData = response.data.data.user.contributionsCollection.contributionCalendar;
    
    // Calculate streaks
    const days = contributionData.weeks.flatMap(week => week.contributionDays);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].contributionCount > 0) {
        tempStreak++;
        if (i === days.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      success: true,
      data: {
        weeks: contributionData.weeks.map(week => ({
          days: week.contributionDays.map(day => ({
            date: day.date,
            count: day.contributionCount,
            level: day.contributionCount === 0 ? 0 
              : day.contributionCount < 3 ? 1 
              : day.contributionCount < 6 ? 2 
              : day.contributionCount < 10 ? 3 
              : 4
          }))
        })),
        stats: {
          total: contributionData.totalContributions,
          currentStreak,
          longestStreak,
        }
      }
    });
  } catch (error) {
    console.error('GitHub contribution fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contribution data',
      error: error.message,
    });
  }
});

export default router;
