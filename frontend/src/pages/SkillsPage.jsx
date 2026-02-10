import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
    <div className="w-full py-12">
      <div className="max-w-6xl mx-auto px-16 sm:px-20 lg:px-32">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-xl font-semibold text-zinc-100 mb-1.5">
            Skills Profile
          </h1>
          <p className="text-sm text-zinc-500">
            {hasSkills
              ? 'Manage your skills to get personalized project recommendations'
              : 'Upload your resume or add skills manually to get started'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Add Skills */}
          <div className="space-y-8">
            {/* Resume Upload Section */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
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
                        className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isDragActive
                            ? 'border-indigo-500 bg-indigo-500/5'
                            : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-5 h-5 text-zinc-500" />
                        </div>
                        <p className="text-zinc-200 text-sm font-medium mb-0.5">
                          {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                        </p>
                        <p className="text-xs text-zinc-600">
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
                      className="text-center py-6"
                    >
                      <Spinner className="mx-auto mb-3" />
                      <p className="text-zinc-200 text-sm font-medium">Analyzing your resume...</p>
                      <p className="text-xs text-zinc-500">Extracting skills with AI</p>
                    </motion.div>
                  )}

                  {(uploadState === 'success' || hasResume) && uploadState !== 'uploading' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-zinc-200 text-sm font-medium mb-0.5">Resume processed!</p>
                      <p className="text-xs text-zinc-500 mb-3">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <p className="text-zinc-200 text-sm font-medium mb-0.5">Upload failed</p>
                      <p className="text-xs text-red-400 mb-3">{uploadError}</p>
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

            {/* Manual Skill Input */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add Manually
                </Card.Title>
                <Card.Description>
                  Add your technical skills, frameworks, and tools
                </Card.Description>
              </Card.Header>

              <Card.Content>
                <form onSubmit={handleAddSkill} className="flex gap-3">
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
                    size="sm"
                    icon={Plus}
                  >
                    Add
                  </Button>
                </form>

                {/* Quick Add Suggestions */}
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Quick add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Go', 'Docker']
                      .filter(s => !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase()))
                      .slice(0, 5)
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => setNewSkill(skill)}
                          className="px-2 py-1 text-xs rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors border border-zinc-800 hover:border-zinc-700"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Right Column - Skills List */}
          <div className="space-y-8">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card.Header>

              <Card.Content>
                {hasSkills ? (
                  <div className="space-y-3 max-h-100 overflow-y-auto pr-1">
                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 group transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-200 text-sm">{skill.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                            {skill.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {skill.confidence && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${skill.confidence}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-600 w-6 text-right">
                                {skill.confidence}%
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteSkill(skill.name)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-5 h-5 text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 text-sm mb-1">No skills added yet</p>
                    <p className="text-xs text-zinc-600">
                      Upload your resume or add skills manually
                    </p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Get Recommendations Button */}
            {hasSkills && (
              <div className="text-center">
                <Button
                  onClick={handleGetRecommendations}
                  loading={loadingRecommendations}
                  variant="secondary"
                  size="md"
                  icon={Target}
                >
                  Get Project Recommendations
                </Button>
                <p className="text-xs text-zinc-600 mt-2">
                  Based on your {skills.length} skill{skills.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;
