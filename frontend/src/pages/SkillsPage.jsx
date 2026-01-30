import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload,
  Sparkles,
  Plus,
  X,
  Trash2,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Code,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Input, Spinner } from '../components/ui';
import api from '../api/axios';

const SkillsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  
  // Upload state
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState('');
  
  // Manual skill input
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  
  // Recommendations
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Fetch user skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/skills');
      if (response.success) {
        setSkills(response.data.skills || []);
        setHasResume(response.data.hasResume);
        setResumeInfo({
          filename: response.data.resumeFilename,
          uploadedAt: response.data.resumeUploadedAt,
        });
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadState('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/skills/extract-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // 90 second timeout
      });

      console.log('Frontend received response:', response);

      if (response.success) {
        setSkills(response.data.skills);
        setHasResume(true);
        setResumeInfo({
          filename: file.name,
          uploadedAt: new Date().toISOString(),
        });
        setUploadState('success');
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.message || 
                       error.message === 'Unexpected response format' ? 'Failed to process response' :
                       error.code === 'ECONNABORTED' ? 'Upload timed out after 90 seconds. Please try a smaller file or try again.' :
                       error.code === 'ERR_NETWORK' ? 'Network error. Please check if the backend server is running.' :
                       'Failed to process resume. Please try again.';
      setUploadError(errorMsg);
      setUploadState('error');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  // Add skill manually
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    setAddingSkill(true);
    try {
      const response = await api.post('/skills', {
        skills: [{ name: newSkill.trim(), category: 'Manual' }],
      });

      if (response.success) {
        setSkills(response.data.skills);
        setNewSkill('');
      }
    } catch (error) {
      console.error('Failed to add skill:', error);
    } finally {
      setAddingSkill(false);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillName) => {
    try {
      const response = await api.delete(`/skills/${encodeURIComponent(skillName)}`);
      if (response.success) {
        setSkills(response.data.skills);
      }
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  // Clear all skills
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all skills?')) return;
    
    try {
      const response = await api.delete('/skills/all');
      if (response.success) {
        setSkills([]);
        setHasResume(false);
        setResumeInfo(null);
        setUploadState('idle');
      }
    } catch (error) {
      console.error('Failed to clear skills:', error);
    }
  };

  // Get recommendations
  const handleGetRecommendations = async () => {
    if (skills.length === 0) return;
    
    setLoadingRecommendations(true);
    // Navigate to dashboard which will fetch recommendations
    navigate('/dashboard', { state: { fetchRecommendations: true } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasSkills = skills.length > 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Skills Profile
          </h1>
          <p className="text-slate-400">
            {hasSkills
              ? 'Manage your skills to get personalized project recommendations'
              : 'Upload your resume or add skills manually to get started'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add Skills */}
          <div className="space-y-6">
            {/* Resume Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    {hasResume ? 'Resume Uploaded' : 'Upload Resume'}
                  </Card.Title>
                  <Card.Description>
                    {hasResume
                      ? `Last uploaded: ${resumeInfo?.filename}`
                      : 'Extract skills automatically from your resume'}
                  </Card.Description>
                </Card.Header>

                <Card.Content>
                  <AnimatePresence mode="wait">
                    {uploadState === 'idle' && !hasResume && (
                      <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                            isDragActive
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
                          }`}
                        >
                          <input {...getInputProps()} />
                          <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-7 h-7 text-slate-400" />
                          </div>
                          <p className="text-white font-medium mb-1">
                            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                          </p>
                          <p className="text-sm text-slate-500">
                            PDF, DOC, or DOCX (max 5MB)
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {uploadState === 'uploading' && (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                      >
                        <Spinner className="mx-auto mb-4" />
                        <p className="text-white font-medium">Analyzing your resume...</p>
                        <p className="text-sm text-slate-500">Extracting skills with AI</p>
                      </motion.div>
                    )}

                    {(uploadState === 'success' || hasResume) && uploadState !== 'uploading' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-6"
                      >
                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-white font-medium mb-1">Resume processed!</p>
                        <p className="text-sm text-slate-500 mb-4">
                          {resumeInfo?.filename}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setUploadState('idle');
                            setHasResume(false);
                          }}
                          icon={RefreshCw}
                        >
                          Upload New
                        </Button>
                      </motion.div>
                    )}

                    {uploadState === 'error' && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-6"
                      >
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                          <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-white font-medium mb-1">Upload failed</p>
                        <p className="text-sm text-red-400 mb-4">{uploadError}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setUploadState('idle')}
                        >
                          Try Again
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card.Content>
              </Card>
            </motion.div>

            {/* Manual Skill Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-400" />
                    Add Skills Manually
                  </Card.Title>
                  <Card.Description>
                    Add your technical skills, frameworks, and tools
                  </Card.Description>
                </Card.Header>

                <Card.Content>
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., React, Python, Docker..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newSkill.trim() || addingSkill}
                      loading={addingSkill}
                      icon={Plus}
                    >
                      Add
                    </Button>
                  </form>

                  {/* Quick Add Suggestions */}
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Go', 'Docker']
                        .filter(s => !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase()))
                        .slice(0, 5)
                        .map((skill) => (
                          <button
                            key={skill}
                            onClick={() => setNewSkill(skill)}
                            className="px-2 py-1 text-xs rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Skills List */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <div>
                      <Card.Title className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Your Skills ({skills.length})
                      </Card.Title>
                      <Card.Description>
                        {hasSkills ? 'Click to remove a skill' : 'No skills added yet'}
                      </Card.Description>
                    </div>
                    {hasSkills && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card.Header>

                <Card.Content>
                  {hasSkills ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {skills.map((skill, index) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Code className="w-4 h-4 text-slate-500" />
                            <span className="text-white">{skill.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                              {skill.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {skill.confidence && (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    style={{ width: `${skill.confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 w-8">
                                  {skill.confidence}%
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => handleDeleteSkill(skill.name)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-400 mb-2">No skills added yet</p>
                      <p className="text-sm text-slate-500">
                        Upload your resume or add skills manually
                      </p>
                    </div>
                  )}
                </Card.Content>
              </Card>
            </motion.div>

            {/* Get Recommendations Button */}
            {hasSkills && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleGetRecommendations}
                  loading={loadingRecommendations}
                  className="w-full py-4 text-lg"
                  icon={Target}
                  iconPosition="left"
                >
                  Get Project Recommendations
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-sm text-slate-500 mt-2">
                  Based on your {skills.length} skill{skills.length > 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;
