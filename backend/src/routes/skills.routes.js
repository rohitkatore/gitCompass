import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';

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
        timeout: 60000, // 60 second timeout for AI processing
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
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please ensure the Python AI service is running on port 8000.',
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

export default router;
