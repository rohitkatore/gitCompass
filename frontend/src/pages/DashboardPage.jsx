import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Code,
  Target,
  Star,
  GitFork,
  ArrowRight,
  User,
  RefreshCw,
  Users,
  FolderGit2,
  MapPin,
  Building2,
  ExternalLink,
  Bookmark,
  Calendar,
  Activity,
  Award,
  Zap,
  GitCommit,
  Plus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Spinner, CardSkeleton } from '../components/ui/Loading';
import { formatNumber, formatRelativeTime, getLanguageColor, getDifficultyColor } from '../lib/utils';
import api, { repositoryService } from '../api/axios';

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [contributionData, setContributionData] = useState([]);
  const [contributionStats, setContributionStats] = useState({
    total: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loadingContributions, setLoadingContributions] = useState(false);

  // Fetch user skills from database
  useEffect(() => {
    const fetchSkills = async () => {
      if (!user) return;
      
      setLoadingSkills(true);
      try {
        const response = await api.get('/skills');
        if (response.success) {
          setSkills(response.data.skills || []);
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchSkills();
  }, [user]);

  // Fetch recommendations when coming from Skills page or on button click
  useEffect(() => {
    if (location.state?.fetchRecommendations && skills.length > 0) {
      loadRecommendations();
      // Clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, skills]);

  // Fetch real GitHub contribution data
  useEffect(() => {
    const fetchContributions = async () => {
      if (!user) return;
      
      setLoadingContributions(true);
      try {
        const response = await fetch('/api/auth/contributions', {
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (data.success) {
          setContributionData(data.data.weeks.map(week => week.days));
          setContributionStats(data.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch contributions:', error);
      } finally {
        setLoadingContributions(false);
      }
    };

    fetchContributions();
  }, [user]);

  const loadRecommendations = async () => {
    if (skills.length === 0) {
      navigate('/skills');
      return;
    }
    
    setLoadingRecommendations(true);

    try {
      const response = await repositoryService.getRecommendations();
      
      if (response.success) {
        const repos = response.data || [];
        setRecommendations(repos);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let score = 0;
    const checks = [
      user.avatar,
      user.bio,
      user.location,
      user.company,
      user.email,
      skills.length > 0,
      user.publicRepos > 0,
    ];
    checks.forEach(check => { if (check) score += Math.floor(100 / checks.length); });
    return Math.min(score, 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Stats for the user
  const userStats = [
    { label: 'Repositories', value: user?.publicRepos || 0, icon: FolderGit2, color: 'text-blue-400' },
    { label: 'Followers', value: user?.followers || 0, icon: Users, color: 'text-green-400' },
    { label: 'Following', value: user?.following || 0, icon: User, color: 'text-purple-400' },
    { label: 'Skills', value: skills.length, icon: Zap, color: 'text-yellow-400' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-md mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-8">
              <User className="w-10 h-10 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to GitCompass
            </h1>
            <p className="text-slate-400 mb-8">
              Sign in with GitHub to access your personalized dashboard and get
              AI-powered project recommendations.
            </p>
            <Button
              as="a"
              href="/api/auth/github"
              size="lg"
              className="gap-2"
            >
              Sign in with GitHub
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header with User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {user?.avatar && (
                <img 
                  src={user.avatar} 
                  alt={user.displayName || user.username}
                  className="w-16 h-16 rounded-full border-2 border-indigo-500/50"
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Welcome back, {user?.displayName || user?.username || 'Developer'}! 👋
                </h1>
                <p className="text-slate-400 mt-1 flex flex-wrap items-center gap-2 text-sm">
                  @{user?.username}
                  {user?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </span>
                  )}
                  {user?.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {user.company}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <a 
              href={user?.profileUrl || `https://github.com/${user?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              View GitHub Profile
            </a>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {userStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-2xl font-bold text-white">{formatNumber(stat.value)}</span>
              </div>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Profile Completion Banner */}
        {profileCompletion < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span className="font-medium text-white">Complete Your Profile</span>
                </div>
                <span className="text-sm text-indigo-400">{profileCompletion}% complete</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {!user?.bio && "Add a bio • "}
                {skills.length === 0 && "Add your skills • "}
                {!user?.location && "Add your location"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          {/* Left Column - Skills & Actions */}
          <div className="space-y-6">
            {/* Skills Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <Card.Title className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Your Skills
                    </Card.Title>
                    <Link 
                      to="/skills"
                      className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Manage <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <Card.Description>
                    {skills.length > 0 
                      ? `${skills.length} skills in your profile`
                      : 'Add skills to get recommendations'}
                  </Card.Description>
                </Card.Header>

                <Card.Content>
                  {loadingSkills ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                    </div>
                  ) : skills.length > 0 ? (
                    <div className="space-y-2">
                      {skills.slice(0, 6).map((skill, index) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30"
                        >
                          <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-slate-500" />
                            <span className="text-white text-sm">{skill.name}</span>
                          </div>
                          {skill.confidence && (
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                  style={{ width: `${skill.confidence}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {skills.length > 6 && (
                        <Link 
                          to="/skills"
                          className="block text-center text-sm text-slate-400 hover:text-white py-2"
                        >
                          +{skills.length - 6} more skills
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm mb-3">No skills added yet</p>
                      <Button
                        as={Link}
                        to="/skills"
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                      >
                        Add Skills
                      </Button>
                    </div>
                  )}
                </Card.Content>
              </Card>
            </motion.div>

            {/* Get Recommendations Button */}
            {skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Button
                  onClick={loadRecommendations}
                  loading={loadingRecommendations}
                  className="w-full py-4"
                  icon={Target}
                >
                  {recommendations.length > 0 ? 'Refresh Recommendations' : 'Get Recommendations'}
                </Button>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Quick Actions
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2">
                    <Link
                      to="/search"
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-white">Explore Projects</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Link>
                    <Link
                      to="/skills"
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-white">Manage Skills</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Link>
                    <a
                      href={user?.profileUrl || `https://github.com/${user?.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <FolderGit2 className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-white">Your Repositories</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </Card.Content>
              </Card>
            </motion.div>

            {/* Member Since */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Member since</p>
                    <p className="text-white font-medium">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : 'Recently joined'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Contributions & Recommendations */}
          <div className="space-y-6">
            {/* Contribution Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <Card.Header>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <Card.Title className="flex items-center gap-2">
                        <GitCommit className="w-5 h-5 text-green-400" />
                        Contribution Activity
                      </Card.Title>
                      <Card.Description className="mt-1">
                        {contributionStats.total} contributions in the last year
                      </Card.Description>
                    </div>
                    <div className="flex gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{contributionStats.total}</div>
                        <div className="text-slate-400 text-xs">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{contributionStats.currentStreak}</div>
                        <div className="text-slate-400 text-xs">Day Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{contributionStats.longestStreak}</div>
                        <div className="text-slate-400 text-xs">Best Streak</div>
                      </div>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  {loadingContributions ? (
                    <div className="flex items-center justify-center py-16">
                      <Spinner />
                    </div>
                  ) : contributionData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="inline-flex gap-1">
                        {contributionData.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-1">
                            {week.map((day, dayIndex) => {
                              const colors = [
                                'bg-slate-800/50',
                                'bg-green-900/40',
                                'bg-green-700/60',
                                'bg-green-500/80',
                                'bg-green-400',
                              ];
                              return (
                                <motion.div
                                  key={`${weekIndex}-${dayIndex}`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.001 }}
                                  className={`w-3 h-3 rounded-sm ${colors[day.level]} hover:ring-2 hover:ring-green-400 transition-all cursor-pointer`}
                                  title={`${day.date}: ${day.count} contributions`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-sm bg-slate-800/50"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-900/40"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-700/60"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-500/80"></div>
                          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                        </div>
                        <span>More</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-slate-400">No contribution data available</p>
                    </div>
                  )}
                </Card.Content>
              </Card>
            </motion.div>

            {/* Recommended Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card padding="none">
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Recommended Projects
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {recommendations.length > 0
                          ? `${recommendations.length} projects match your skills`
                          : skills.length > 0 
                            ? 'Click "Get Recommendations" to find projects'
                            : 'Add skills to get personalized recommendations'}
                      </p>
                    </div>
                    {recommendations.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={loadRecommendations}
                        loading={loadingRecommendations}
                      >
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {loadingRecommendations ? (
                    <div className="space-y-4">
                      {Array(3).fill(null).map((_, i) => (
                        <CardSkeleton key={i} />
                      ))}
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((repo, index) => {
                        if (!repo || !repo.owner) return null;
                        
                        return (
                          <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 hover:bg-slate-800/30 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <img
                                    src={repo.owner.avatarUrl}
                                    alt={repo.owner.login}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="min-w-0">
                                    <Link
                                      to={`/repository/${repo.fullName}`}
                                      className="text-white font-semibold hover:text-indigo-400 transition-colors truncate block"
                                    >
                                      {repo.fullName}
                                    </Link>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(repo.difficulty)}`}>
                                    {repo.difficulty}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                                  {repo.description || 'No description available'}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <span 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                                      />
                                      <span className="text-slate-400">{repo.language}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Star className="w-4 h-4" />
                                    {formatNumber(repo.stars)}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <GitFork className="w-4 h-4" />
                                    {formatNumber(repo.forks)}
                                  </span>
                                  <span className="text-green-400 text-xs px-2 py-0.5 bg-green-500/10 rounded-full">
                                    {repo.matchScore}% match
                                  </span>
                                </div>
                              </div>
                              <Button
                                as={Link}
                                to={`/repository/${repo.fullName}`}
                                variant="ghost"
                                size="sm"
                                icon={ArrowRight}
                                iconPosition="right"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {skills.length > 0 ? 'Ready for recommendations' : 'No skills added yet'}
                      </h3>
                      <p className="text-slate-400 max-w-sm mx-auto mb-4">
                        {skills.length > 0 
                          ? 'Click the button to get AI-powered project recommendations based on your skills.'
                          : 'Add your skills to get personalized open source project recommendations.'}
                      </p>
                      {skills.length === 0 && (
                        <Button
                          as={Link}
                          to="/skills"
                          icon={Plus}
                        >
                          Add Skills
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
