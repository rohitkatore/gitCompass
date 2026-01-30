import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  GitFork,
  Eye,
  ExternalLink,
  Clock,
  Code,
  BookOpen,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Spinner, DotsLoader } from '../components/ui/Loading';
import { formatNumber, formatRelativeTime, getLanguageColor, getDifficultyColor } from '../lib/utils';
import api from '../api/axios';

const RepositoryPage = ({ user }) => {
  const { owner, repo } = useParams();
  const [repository, setRepository] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Issue modal state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueGuide, setIssueGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);
  const [error, setError] = useState(null);

  // Classify issue difficulty based on labels and comments
  const classifyDifficulty = (issue) => {
    const labels = issue.labels.map(l => l.name.toLowerCase());
    
    if (labels.includes('good first issue') || labels.includes('beginner') || labels.includes('easy')) {
      return 'easy';
    } else if (labels.includes('help wanted') || labels.includes('intermediate')) {
      return 'medium';
    } else if (labels.includes('complex') || labels.includes('advanced') || labels.includes('hard')) {
      return 'hard';
    }
    
    // Classify based on comments count
    if (issue.comments <= 3) return 'easy';
    if (issue.comments <= 10) return 'medium';
    return 'hard';
  };

  useEffect(() => {
    const fetchRepositoryData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch repository info from GitHub API
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        
        if (!repoResponse.ok) {
          throw new Error('Repository not found');
        }
        
        const repoData = await repoResponse.json();
        
        setRepository({
          name: repoData.name,
          fullName: repoData.full_name,
          owner: { 
            login: repoData.owner.login, 
            avatarUrl: repoData.owner.avatar_url 
          },
          description: repoData.description || 'No description available',
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          watchers: repoData.watchers_count,
          language: repoData.language || 'Unknown',
          topics: repoData.topics || [],
          createdAt: repoData.created_at,
          updatedAt: repoData.updated_at,
          license: repoData.license?.name || 'No license',
          openIssuesCount: repoData.open_issues_count,
          defaultBranch: repoData.default_branch,
          htmlUrl: repoData.html_url,
          homepage: repoData.homepage,
        });

        // Fetch good first issues from GitHub API
        const issuesResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues?labels=good%20first%20issue&state=open&per_page=10`
        );
        
        let issuesData = [];
        
        if (issuesResponse.ok) {
          issuesData = await issuesResponse.json();
        }
        
        // If no good first issues, fetch help wanted issues
        if (issuesData.length === 0) {
          const helpWantedResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues?labels=help%20wanted&state=open&per_page=10`
          );
          if (helpWantedResponse.ok) {
            issuesData = await helpWantedResponse.json();
          }
        }
        
        // If still no issues, fetch any open issues
        if (issuesData.length === 0) {
          const anyIssuesResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`
          );
          if (anyIssuesResponse.ok) {
            issuesData = await anyIssuesResponse.json();
          }
        }
        
        // Filter out pull requests (GitHub API returns PRs as issues too)
        const filteredIssues = issuesData.filter(issue => !issue.pull_request);
        
        // Transform issues data
        const transformedIssues = filteredIssues.map(issue => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body || '',
          labels: issue.labels.map(label => ({
            name: label.name,
            color: label.color,
          })),
          state: issue.state,
          createdAt: issue.created_at,
          comments: issue.comments,
          difficulty: classifyDifficulty(issue),
          user: {
            login: issue.user.login,
            avatarUrl: issue.user.avatar_url,
          },
        }));

        setIssues(transformedIssues);
        
      } catch (err) {
        console.error('Error fetching repository data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositoryData();
  }, [owner, repo]);

  // Open issue modal
  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setIssueGuide(null);
    setShowFullGuide(false);
  };

  // Close issue modal
  const closeIssueModal = () => {
    setSelectedIssue(null);
    setIssueGuide(null);
    setLoadingGuide(false);
    setShowFullGuide(false);
  };

  // Generate guide for selected issue
  const generateGuideForIssue = async () => {
    if (!selectedIssue || !repository) return;
    
    setLoadingGuide(true);
    
    try {
      const response = await api.post('/guide/generate', {
        repoData: {
          name: repository.name,
          fullName: repository.fullName,
          description: repository.description,
          language: repository.language,
          stars: repository.stars,
          topics: repository.topics,
        },
        issueData: {
          number: selectedIssue.number,
          title: selectedIssue.title,
          labels: selectedIssue.labels.map(l => l.name),
          difficulty: selectedIssue.difficulty,
          comments: selectedIssue.comments,
        },
        userContext: {
          skills: user?.skills || [],
        },
      });

      if (response.success) {
        setIssueGuide(response.data);
        setShowFullGuide(true);
      } else {
        console.error('Failed to generate guide:', response.message);
        // Set a fallback guide
        setIssueGuide({
          summary: `This issue "${selectedIssue.title}" is a great opportunity to contribute to ${repository.fullName}.`,
          gettingStarted: [
            `Fork the repository to your GitHub account`,
            `Clone your fork: \`git clone https://github.com/YOUR_USERNAME/${repository.name}.git\``,
            `Create a new branch: \`git checkout -b fix/issue-${selectedIssue.number}\``,
            `Make your changes addressing the issue`,
            `Push and create a Pull Request`,
          ],
          issueAnalysis: {
            difficulty: selectedIssue.difficulty,
            estimatedTime: selectedIssue.difficulty === 'easy' ? '1-2 hours' : selectedIssue.difficulty === 'medium' ? '3-5 hours' : '1-2 days',
          },
          tips: [
            'Read the issue comments thoroughly',
            'Check if someone is already working on it',
            'Ask questions if anything is unclear',
          ],
        });
        setShowFullGuide(true);
      }
    } catch (error) {
      console.error('Error generating guide:', error);
      // Set a fallback guide on error
      setIssueGuide({
        summary: `This issue "${selectedIssue.title}" is a great opportunity to contribute to ${repository.fullName}.`,
        gettingStarted: [
          `Fork the repository to your GitHub account`,
          `Clone your fork: \`git clone https://github.com/YOUR_USERNAME/${repository.name}.git\``,
          `Create a new branch: \`git checkout -b fix/issue-${selectedIssue.number}\``,
          `Make your changes addressing the issue`,
          `Push and create a Pull Request`,
        ],
        issueAnalysis: {
          difficulty: selectedIssue.difficulty,
          estimatedTime: selectedIssue.difficulty === 'easy' ? '1-2 hours' : selectedIssue.difficulty === 'medium' ? '3-5 hours' : '1-2 days',
        },
        tips: [
          'Read the issue comments thoroughly',
          'Check if someone is already working on it',
          'Ask questions if anything is unclear',
        ],
      });
      setShowFullGuide(true);
    } finally {
      setLoadingGuide(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {error === 'Repository not found' ? 'Repository not found' : 'Failed to load repository'}
          </h2>
          <p className="text-slate-400 mb-6">
            {error === 'Repository not found' 
              ? "The repository you're looking for doesn't exist."
              : 'There was an error loading the repository. Please try again.'}
          </p>
          <Link to="/search">
            <Button variant="secondary">Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </motion.div>

        {/* Repository Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card glass>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <img
                src={repository.owner.avatarUrl}
                alt={repository.owner.login}
                className="w-20 h-20 rounded-2xl border border-slate-700"
              />
              
              <div className="flex-grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {repository.fullName}
                    </h1>
                    <p className="text-slate-400 mb-4">{repository.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {repository.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm border border-indigo-500/30"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <a
                    href={repository.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary" icon={ExternalLink}>
                      View on GitHub
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{formatNumber(repository.stars)}</div>
                  <div className="text-xs text-slate-500">Stars</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GitFork className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{formatNumber(repository.forks)}</div>
                  <div className="text-xs text-slate-500">Forks</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{formatNumber(repository.watchers)}</div>
                  <div className="text-xs text-slate-500">Watchers</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{formatNumber(repository.openIssuesCount)}</div>
                  <div className="text-xs text-slate-500">Open Issues</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Issues Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card padding="none">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-400" />
                    Good First Issues
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Issues that are great for first-time contributors
                  </p>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {issues.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No open issues found</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        This repository doesn't have any open issues labeled for beginners right now.
                      </p>
                      <a
                        href={`${repository.htmlUrl}/issues`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" icon={ExternalLink}>
                          View All Issues on GitHub
                        </Button>
                      </a>
                    </div>
                  ) : (
                    issues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => openIssueModal(issue)}
                      className="p-6 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          issue.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                          issue.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="text-white font-medium hover:text-indigo-400 transition-colors line-clamp-1">
                            #{issue.number} {issue.title}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {issue.labels.map((label) => (
                              <span
                                key={label.name}
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  color: `#${label.color}`,
                                  border: `1px solid #${label.color}40`,
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getDifficultyColor(issue.difficulty)}`}>
                              {issue.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatRelativeTime(issue.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {issue.comments} comments
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className="text-xs text-slate-500">Click for guide →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Quick Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="sticky top-24">
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Contribution Guide
                  </Card.Title>
                  <Card.Description>
                    Click on any issue to get a personalized guide
                  </Card.Description>
                </Card.Header>

                <Card.Content>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-slate-400 text-sm">
                      Select an issue from the list to generate a personalized contribution guide tailored to that specific issue.
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Issue Detail Modal */}
        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeIssueModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                          selectedIssue.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                          selectedIssue.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          #{selectedIssue.number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getDifficultyColor(selectedIssue.difficulty)}`}>
                          {selectedIssue.difficulty}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{selectedIssue.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {selectedIssue.labels.map((label) => (
                          <span
                            key={label.name}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`,
                              border: `1px solid #${label.color}40`,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={closeIssueModal}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                  {/* Issue Meta */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatRelativeTime(selectedIssue.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {selectedIssue.comments} comments
                    </span>
                    <a
                      href={`${repository?.htmlUrl}/issues/${selectedIssue.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on GitHub
                    </a>
                  </div>

                  {/* Generate Guide Section */}
                  {!issueGuide && !loadingGuide && (
                    <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">
                      <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Get a Personalized Contribution Guide
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
                        Our AI will analyze this issue and your skills to create a step-by-step guide for contributing.
                      </p>
                      <Button onClick={generateGuideForIssue} icon={Sparkles}>
                        Generate Guide for This Issue
                      </Button>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingGuide && (
                    <div className="text-center py-12">
                      <DotsLoader className="justify-center mb-4" />
                      <p className="text-slate-400">
                        AI is analyzing this issue and creating your guide...
                      </p>
                    </div>
                  )}

                  {/* Guide Content */}
                  {issueGuide && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Summary */}
                      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <p className="text-slate-300">{issueGuide.summary}</p>
                      </div>

                      {/* Issue Analysis */}
                      {issueGuide.issueAnalysis && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Difficulty</div>
                            <div className="text-white font-medium capitalize">{issueGuide.issueAnalysis.difficulty}</div>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">Estimated Time</div>
                            <div className="text-white font-medium">{issueGuide.issueAnalysis.estimatedTime}</div>
                          </div>
                        </div>
                      )}

                      {/* Getting Started */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Code className="w-4 h-4 text-green-400" />
                          Getting Started
                        </h4>
                        <ol className="space-y-2">
                          {issueGuide.gettingStarted?.map((step, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Code Conventions */}
                      {issueGuide.codeConventions && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            Code Conventions
                          </h4>
                          <ul className="space-y-1">
                            {issueGuide.codeConventions.map((convention, i) => (
                              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                {convention}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tips */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          Pro Tips
                        </h4>
                        <ul className="space-y-1">
                          {issueGuide.tips?.map((tip, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-yellow-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
                  <Button variant="ghost" onClick={closeIssueModal}>
                    Close
                  </Button>
                  <Button 
                    variant="secondary" 
                    icon={ExternalLink}
                    onClick={() => window.open(`${repository?.htmlUrl}/issues/${selectedIssue.number}`, '_blank')}
                  >
                    Open Issue on GitHub
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RepositoryPage;
