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
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-100 mb-1">
            {error === 'Repository not found' ? 'Repository not found' : 'Failed to load repository'}
          </h2>
          <p className="text-sm text-zinc-500 mb-4">
            {error === 'Repository not found' 
              ? "The repository you're looking for doesn't exist."
              : 'There was an error loading the repository. Please try again.'}
          </p>
          <Link to="/search">
            <Button variant="secondary" size="sm">Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <div className="max-w-6xl mx-auto px-16 sm:px-20 lg:px-32">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Search
          </Link>
        </div>

        {/* Repository Header */}
        <div className="mb-8">
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <img
                src={repository.owner.avatarUrl}
                alt={repository.owner.login}
                className="w-14 h-14 rounded-xl border border-zinc-800"
              />
              
              <div className="grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100 mb-1">
                      {repository.fullName}
                    </h1>
                    <p className="text-sm text-zinc-500 mb-3">{repository.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {repository.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700/50"
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
                    <Button variant="secondary" size="sm" icon={ExternalLink}>
                      View on GitHub
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100">{formatNumber(repository.stars)}</div>
                  <div className="text-[10px] text-zinc-500">Stars</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GitFork className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100">{formatNumber(repository.forks)}</div>
                  <div className="text-[10px] text-zinc-500">Forks</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100">{formatNumber(repository.watchers)}</div>
                  <div className="text-[10px] text-zinc-500">Watchers</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100">{formatNumber(repository.openIssuesCount)}</div>
                  <div className="text-[10px] text-zinc-500">Open Issues</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Issues Section */}
          <div className="lg:col-span-2">
            <Card padding="none">
                <div className="p-4 border-b border-zinc-800">
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Good First Issues
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Issues that are great for first-time contributors
                  </p>
                </div>

                <div className="divide-y divide-zinc-800">
                  {issues.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-zinc-200 mb-1">No open issues found</h3>
                      <p className="text-xs text-zinc-500 mb-3">
                        This repository doesn't have any open issues labeled for beginners right now.
                      </p>
                      <a
                        href={`${repository.htmlUrl}/issues`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm" icon={ExternalLink}>
                          View All Issues on GitHub
                        </Button>
                      </a>
                    </div>
                  ) : (
                    issues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => openIssueModal(issue)}
                      className="p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          issue.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-500' :
                          issue.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-500' :
                          'bg-red-500/15 text-red-500'
                        }`}>
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="grow min-w-0">
                          <div className="text-sm text-zinc-200 font-medium hover:text-indigo-400 transition-colors line-clamp-1">
                            #{issue.number} {issue.title}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {issue.labels.map((label) => (
                              <span
                                key={label.name}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  color: `#${label.color}`,
                                  border: `1px solid #${label.color}40`,
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getDifficultyColor(issue.difficulty)}`}>
                              {issue.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(issue.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {issue.comments}
                            </span>
                          </div>
                        </div>
                        
                        <span className="text-[10px] text-zinc-600 shrink-0">guide →</span>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </Card>
          </div>

          {/* Sidebar - Quick Info */}
          <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <Card.Header>
                  <Card.Title className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AI Contribution Guide
                  </Card.Title>
                  <Card.Description>
                    Click on any issue to get a personalized guide
                  </Card.Description>
                </Card.Header>

                <Card.Content>
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-xs text-zinc-500">
                      Select an issue from the list to generate a personalized contribution guide tailored to that specific issue.
                    </p>
                  </div>
                </Card.Content>
              </Card>
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
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grow">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                          selectedIssue.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-500' :
                          selectedIssue.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-500' :
                          'bg-red-500/15 text-red-500'
                        }`}>
                          #{selectedIssue.number}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getDifficultyColor(selectedIssue.difficulty)}`}>
                          {selectedIssue.difficulty}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-zinc-100">{selectedIssue.title}</h2>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {selectedIssue.labels.map((label) => (
                          <span
                            key={label.name}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
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
                      className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                  {/* Issue Meta */}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(selectedIssue.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {selectedIssue.comments} comments
                    </span>
                    <a
                      href={`${repository?.htmlUrl}/issues/${selectedIssue.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on GitHub
                    </a>
                  </div>

                  {/* Generate Guide Section */}
                  {!issueGuide && !loadingGuide && (
                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                      <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                        Get a Personalized Contribution Guide
                      </h3>
                      <p className="text-xs text-zinc-500 mb-3 max-w-sm mx-auto">
                        Our AI will analyze this issue and your skills to create a step-by-step guide.
                      </p>
                      <Button onClick={generateGuideForIssue} size="sm" icon={Sparkles}>
                        Generate Guide
                      </Button>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingGuide && (
                    <div className="text-center py-8">
                      <DotsLoader className="justify-center mb-3" />
                      <p className="text-xs text-zinc-500">
                        AI is analyzing this issue and creating your guide...
                      </p>
                    </div>
                  )}

                  {/* Guide Content */}
                  {issueGuide && (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-xs text-zinc-300">{issueGuide.summary}</p>
                      </div>

                      {/* Issue Analysis */}
                      {issueGuide.issueAnalysis && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 mb-0.5">Difficulty</div>
                            <div className="text-sm text-zinc-100 font-medium capitalize">{issueGuide.issueAnalysis.difficulty}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 mb-0.5">Estimated Time</div>
                            <div className="text-sm text-zinc-100 font-medium">{issueGuide.issueAnalysis.estimatedTime}</div>
                          </div>
                        </div>
                      )}

                      {/* Getting Started */}
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-emerald-400" />
                          Getting Started
                        </h4>
                        <ol className="space-y-1.5">
                          {issueGuide.gettingStarted?.map((step, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-medium">
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
                          <h4 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                            Code Conventions
                          </h4>
                          <ul className="space-y-1">
                            {issueGuide.codeConventions.map((convention, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                {convention}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tips */}
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                          Pro Tips
                        </h4>
                        <ul className="space-y-1">
                          {issueGuide.tips?.map((tip, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                              <span className="text-yellow-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3 border-t border-zinc-800 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={closeIssueModal}>
                    Close
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => window.open(`${repository?.htmlUrl}/issues/${selectedIssue.number}`, '_blank')}
                  >
                    Open on GitHub
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
