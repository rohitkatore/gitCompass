import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { createRequire } from 'module';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';

// pdf-parse is CJS — use createRequire to load it in ESM context
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ── Local skill extraction (used when AI engine is unreachable) ────────────────
// Mirrors the regex logic in ai-engine/services/resume_processor.py
const TECH_SKILLS = {
  // Languages
  python: 'Language', javascript: 'Language', typescript: 'Language',
  java: 'Language', 'c++': 'Language', 'c#': 'Language', golang: 'Language',
  go: 'Language', rust: 'Language', ruby: 'Language', php: 'Language',
  swift: 'Language', kotlin: 'Language', scala: 'Language', dart: 'Language',
  // Frontend
  react: 'Frontend', 'react.js': 'Frontend', reactjs: 'Frontend',
  vue: 'Frontend', 'vue.js': 'Frontend', angular: 'Frontend',
  svelte: 'Frontend', 'next.js': 'Frontend', nextjs: 'Frontend',
  html: 'Frontend', html5: 'Frontend', css: 'Frontend', css3: 'Frontend',
  sass: 'Frontend', tailwind: 'Frontend', tailwindcss: 'Frontend',
  bootstrap: 'Frontend', redux: 'Frontend', vite: 'Frontend', webpack: 'Frontend',
  // Backend
  'node.js': 'Backend', nodejs: 'Backend', express: 'Backend', fastapi: 'Backend',
  django: 'Backend', flask: 'Backend', spring: 'Backend', 'spring boot': 'Backend',
  rails: 'Backend', laravel: 'Backend', 'nest.js': 'Backend', nestjs: 'Backend',
  graphql: 'Backend', 'rest api': 'Backend', grpc: 'Backend',
  // Database
  mongodb: 'Database', postgresql: 'Database', postgres: 'Database',
  mysql: 'Database', redis: 'Database', sqlite: 'Database', firebase: 'Database',
  elasticsearch: 'Database', cassandra: 'Database', dynamodb: 'Database',
  // DevOps / Cloud
  docker: 'DevOps', kubernetes: 'DevOps', k8s: 'DevOps', aws: 'Cloud',
  gcp: 'Cloud', azure: 'Cloud', terraform: 'DevOps', ansible: 'DevOps',
  jenkins: 'DevOps', 'github actions': 'DevOps', 'ci/cd': 'DevOps',
  linux: 'DevOps', nginx: 'DevOps', git: 'DevOps',
  // AI / ML
  'machine learning': 'AI/ML', 'deep learning': 'AI/ML', tensorflow: 'AI/ML',
  pytorch: 'AI/ML', keras: 'AI/ML', pandas: 'AI/ML', numpy: 'AI/ML',
  'scikit-learn': 'AI/ML', sklearn: 'AI/ML', opencv: 'AI/ML',
  // Mobile
  android: 'Mobile', ios: 'Mobile', 'react native': 'Mobile', flutter: 'Mobile',
  // Testing
  jest: 'Testing', mocha: 'Testing', cypress: 'Testing', selenium: 'Testing',
  pytest: 'Testing',
};

async function localExtractSkills(fileBuffer, mimetype) {
  let rawText = '';
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      rawText = data.text;
    } else {
      // DOCX is a ZIP containing XML — toString gets most readable text
      rawText = fileBuffer.toString('latin1');
    }
  } catch {
    rawText = fileBuffer.toString('latin1');
  }

  const lower = rawText.toLowerCase();
  const found = [];
  const seen = new Set();

  for (const [skill, category] of Object.entries(TECH_SKILLS)) {
    // Whole-word match so "go" doesn't fire inside "google"
    const pattern = new RegExp(`(?<![a-z0-9.])${skill.replace(/[.+]/g, '\\$&')}(?![a-z0-9])`, 'i');
    if (pattern.test(lower) && !seen.has(skill)) {
      seen.add(skill);
      // Normalise display name: title-case single words, preserve multi-word
      const name = skill.includes(' ')
        ? skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : skill.charAt(0).toUpperCase() + skill.slice(1);
      found.push({ name, confidence: 80, category });
    }
  }
  return found;
}

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
    }
  },
});

// @route   GET /api/skills
// @desc    Get user's saved skills
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('skills resume');
    
    res.json({
      success: true,
      data: {
        skills: user.skills || [],
        hasResume: !!user.resume?.filename,
        resumeFilename: user.resume?.filename,
        resumeUploadedAt: user.resume?.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skills',
    });
  }
});

// @route   POST /api/skills
// @desc    Add skill(s) manually
// @access  Private
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { skills } = req.body;
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide skills array',
      });
    }

    const user = await User.findById(req.user._id);
    
    // Add new skills (avoid duplicates)
    const existingSkillNames = new Set(user.skills.map(s => s.name.toLowerCase()));
    
    const newSkills = skills
      .filter(skill => !existingSkillNames.has(skill.name.toLowerCase()))
      .map(skill => ({
        name: skill.name,
        confidence: skill.confidence || 80,
        category: skill.category || 'Manual',
      }));
    
    user.skills.push(...newSkills);
    await user.save();
    
    res.json({
      success: true,
      message: `Added ${newSkills.length} new skill(s)`,
      data: {
        skills: user.skills,
        added: newSkills,
      },
    });
  } catch (error) {
    console.error('Add skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skills',
    });
  }
});

// @route   DELETE /api/skills/all
// @desc    Clear all skills
// @access  Private
router.delete('/all', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skills = [];
    user.resume = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'All skills cleared',
      data: { skills: [] },
    });
  } catch (error) {
    console.error('Clear skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear skills',
    });
  }
});

// @route   DELETE /api/skills/:skillName
// @desc    Delete a skill
// @access  Private
router.delete('/:skillName', isAuthenticated, async (req, res) => {
  try {
    const { skillName } = req.params;
    
    const user = await User.findById(req.user._id);
    
    const initialLength = user.skills.length;
    user.skills = user.skills.filter(
      skill => skill.name.toLowerCase() !== skillName.toLowerCase()
    );
    
    if (user.skills.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Skill deleted successfully',
      data: {
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete skill',
    });
  }
});

// @route   POST /api/skills/extract-resume
// @desc    Upload resume and extract skills
// @access  Private
router.post('/extract-resume', isAuthenticated, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file',
      });
    }

    console.log('Processing resume upload:', req.file.originalname);

    // Send to AI service for extraction
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log('Sending to AI service...');

    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/extract-skills`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000, // 120s — allows for AI engine cold start (30-60s) + processing
      }
    );

    console.log('AI service response received:', aiResponse.data);

    const extractedSkills = aiResponse.data.skills || [];
    
    // Update user with extracted skills and resume info
    const user = await User.findById(req.user._id);
    
    // Merge with existing skills (avoid duplicates)
    const existingSkillNames = new Set(user.skills.map(s => s.name.toLowerCase()));
    
    const newSkills = extractedSkills
      .filter(skill => !existingSkillNames.has(skill.name.toLowerCase()))
      .map(skill => ({
        name: skill.name,
        confidence: skill.confidence || 85,
        category: skill.category || 'Extracted',
      }));
    
    user.skills.push(...newSkills);
    user.resume = {
      filename: req.file.originalname,
      uploadedAt: new Date(),
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: `Extracted ${newSkills.length} new skill(s) from resume`,
      data: {
        skills: user.skills,
        extractedCount: newSkills.length,
        totalCount: user.skills.length,
      },
    });
  } catch (error) {
    console.error('Extract resume error:', error);
    
    // AI engine not running locally — fall back to Node.js regex extractor
    if (error.code === 'ECONNREFUSED') {
      console.log('AI engine unreachable — using local skill extractor as fallback');
      try {
        const extractedSkills = await localExtractSkills(req.file.buffer, req.file.mimetype);
        const user = await User.findById(req.user._id);
        const existingSkillNames = new Set(user.skills.map(s => s.name.toLowerCase()));
        const newSkills = extractedSkills.filter(s => !existingSkillNames.has(s.name.toLowerCase()));
        user.skills.push(...newSkills);
        user.resume = { filename: req.file.originalname, uploadedAt: new Date() };
        await user.save();
        return res.json({
          success: true,
          message: `Extracted ${newSkills.length} skill(s) from resume (local parser)`,
          data: { skills: user.skills, extractedCount: newSkills.length, totalCount: user.skills.length },
        });
      } catch (fallbackErr) {
        console.error('Local extractor also failed:', fallbackErr);
        return res.status(503).json({
          success: false,
          message: 'AI service is not available and local parser failed. Please try again.',
        });
      }
    }

    // Axios timeout (ECONNABORTED) — AI engine is cold-starting, ask user to retry
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is starting up (cold start). Please wait 30 seconds and try again.',
      });
    }
    
    if (error.response) {
      console.error('AI service error response:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Failed to process resume',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process resume: ' + error.message,
    });
  }
});

export default router;
