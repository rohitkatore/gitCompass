import express from 'express';
import multer from 'multer';
import axios from 'axios';
import User from '../models/User.model.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed.'));
    }
  },
});

// @route   POST /api/resume/upload
// @desc    Upload and process resume
// @access  Private
router.post('/upload', isAuthenticated, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Send file to AI service for processing
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Create form data for AI service
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Call AI service to extract skills
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/extract-skills`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000, // 120 second timeout (allows time for model loading)
      }
    );

    const { skills, rawText } = aiResponse.data;

    // Update user with extracted skills
    await User.findByIdAndUpdate(req.user._id, {
      skills: skills,
      resume: {
        filename: req.file.originalname,
        uploadedAt: new Date(),
        rawText: rawText,
      },
    });

    res.json({
      success: true,
      message: 'Resume processed successfully',
      data: {
        filename: req.file.originalname,
        skills: skills,
        skillCount: skills.length,
      },
    });
  } catch (error) {
    console.error('Resume processing error:', error);
    
    // If AI service is unavailable, return mock data for development
    if (error.code === 'ECONNREFUSED') {
      const mockSkills = [
        { name: 'JavaScript', confidence: 95, category: 'Language' },
        { name: 'React', confidence: 90, category: 'Frontend' },
        { name: 'Node.js', confidence: 85, category: 'Backend' },
        { name: 'Python', confidence: 80, category: 'Language' },
        { name: 'MongoDB', confidence: 75, category: 'Database' },
      ];

      await User.findByIdAndUpdate(req.user._id, {
        skills: mockSkills,
        resume: {
          filename: req.file.originalname,
          uploadedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'Resume processed (AI service offline - using mock data)',
        data: {
          filename: req.file.originalname,
          skills: mockSkills,
          skillCount: mockSkills.length,
        },
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process resume',
      error: error.message,
    });
  }
});

// @route   GET /api/resume/skills
// @desc    Get user's extracted skills
// @access  Private
router.get('/skills', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('skills resume');
    
    res.json({
      success: true,
      data: {
        skills: user.skills || [],
        hasResume: !!user.resume?.uploadedAt,
        resumeFilename: user.resume?.filename,
        uploadedAt: user.resume?.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skills',
    });
  }
});

export default router;
