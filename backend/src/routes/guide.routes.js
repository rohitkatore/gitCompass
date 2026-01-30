import express from 'express';
import axios from 'axios';
import { isAuthenticated, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/guide/generate
// @desc    Generate AI contribution guide for a specific issue
// @access  Private (optional)
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { repoData, issueData, userContext } = req.body;

    if (!repoData || !repoData.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Repository data is required',
      });
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      // Call AI service to generate guide
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/generate-guide`,
        {
          repository: repoData,
          issue: issueData || null,
          userSkills: req.user?.skills || userContext?.skills || [],
          userId: req.user?._id,
        },
        { timeout: 60000 } // 60 second timeout for LLM
      );

      return res.json({
        success: true,
        data: aiResponse.data.guide,
      });
    } catch (aiError) {
      // Fallback to template-based guide if AI service is unavailable
      console.log('AI service unavailable, using template guide');

      const issueTitle = issueData?.title || 'this issue';
      const issueNumber = issueData?.number || '';
      const difficulty = issueData?.difficulty || 'medium';
      const labels = issueData?.labels || [];

      const templateGuide = {
        summary: `Issue #${issueNumber}: "${issueTitle}" in ${repoData.fullName} is ${labels.includes('good first issue') ? 'a great starting point for first-time contributors' : 'an opportunity to contribute to an active open-source project'}.`,
        gettingStarted: [
          `Fork the repository to your GitHub account`,
          `Clone your fork: \`git clone https://github.com/YOUR_USERNAME/${repoData.name}.git\``,
          `Navigate to the project directory: \`cd ${repoData.name}\``,
          `Install dependencies (check README.md for specific instructions)`,
          `Create a new branch: \`git checkout -b fix/issue-${issueNumber}\``,
          `Read the issue description and comments thoroughly`,
          `Make your changes addressing the issue requirements`,
          `Test your changes locally`,
          `Commit: \`git commit -m "Fix #${issueNumber}: Brief description"\``,
          `Push and open a Pull Request referencing the issue`,
        ],
        issueAnalysis: {
          difficulty: difficulty,
          estimatedTime: difficulty === 'easy' ? '1-3 hours' : difficulty === 'medium' ? '3-8 hours' : '1-3 days',
          labels: labels,
        },
        codeConventions: [
          'Read the CONTRIBUTING.md file if available',
          'Follow the existing code style in the project',
          'Write tests for new features when applicable',
          'Keep commits atomic and well-documented',
        ],
        tips: [
          `Comment on the issue to let maintainers know you're working on it`,
          'Check if someone is already assigned or working on this issue',
          'Start with understanding the codebase structure',
          'Ask questions in issue comments if requirements are unclear',
          'Reference the issue number in your PR description',
          'Be patient with maintainers - they are often volunteers',
        ],
        resources: [
          {
            title: 'View Issue on GitHub',
            url: `https://github.com/${repoData.fullName}/issues/${issueNumber}`,
          },
          {
            title: 'Repository README',
            url: `https://github.com/${repoData.fullName}#readme`,
          },
          {
            title: 'Pull Requests Guide',
            url: 'https://docs.github.com/en/pull-requests',
          },
        ],
      };

      return res.json({
        success: true,
        data: templateGuide,
        isTemplate: true,
      });
    }
  } catch (error) {
    console.error('Guide generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contribution guide',
    });
  }
});

export default router;
