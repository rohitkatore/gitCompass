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
  Calendar,
  Activity,
  Award,
  Zap,
  GitCommit,
  Plus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { Spinner, CardSkeleton } from '../components/ui/Loading';
import { formatNumber, getLanguageColor, getDifficultyColor } from '../lib/utils';
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
    { label: 'Repos', value: user?.publicRepos || 0, icon: FolderGit2, color: 'text-blue-400' },
    { label: 'Followers', value: user?.followers || 0, icon: Users, color: 'text-emerald-400' },
    { label: 'Following', value: user?.following || 0, icon: User, color: 'text-violet-400' },
    { label: 'Skills', value: skills.length, icon: Zap, color: 'text-amber-400' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-sm mx-auto px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <User className="w-6 h-6 text-zinc-500" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 mb-2">
            Welcome to GitCompass
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Sign in with GitHub to access your personalized dashboard and get
            AI-powered project recommendations.
          </p>
          <Button
            as="a"
            href="/api/auth/github"
            size="md"
          >
            Sign in with GitHub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <Container size="xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  className="w-10 h-10 rounded-full ring-1 ring-zinc-700"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-zinc-100">
                  {user?.displayName || user?.username || 'Developer'}
                </h1>
                <p className="text-zinc-500 flex flex-wrap items-center gap-2 text-sm">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              GitHub Profile
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {userStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-xl font-semibold text-zinc-100">{formatNumber(stat.value)}</div>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Completion */}
        {profileCompletion < 100 && (
          <div className="mb-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-7">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-zinc-200">Complete your profile</span>
                </div>
                <span className="text-xs text-zinc-500">{profileCompletion}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {!user?.bio && "Add a bio · "}
                {skills.length === 0 && "Add your skills · "}
                {!user?.location && "Add your location"}
              </p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          {/* Left Column - Skills & Actions */}
          <div className="space-y-6">
            {/* Skills Section */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <Card.Title className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Skills
                  </Card.Title>
                  <Link
                    to="/skills"
                    className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
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
                  <div className="space-y-3">
                    {skills.slice(0, 6).map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-200 text-sm">{skill.name}</span>
                        </div>
                        {skill.confidence && (
                          <div className="w-10 h-1 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${skill.confidence}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {skills.length > 6 && (
                      <Link
                        to="/skills"
                        className="block text-center text-xs text-zinc-500 hover:text-zinc-300 py-2 transition-colors"
                      >
                        +{skills.length - 6} more
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-4 h-4 text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 text-sm mb-3">No skills added yet</p>
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

            {/* Get Recommendations Button */}
            {skills.length > 0 && (
              <Button
                onClick={loadRecommendations}
                loading={loadingRecommendations}
                icon={Target}
                variant="secondary"
                size="md"
                className="w-full"
              >
                {recommendations.length > 0 ? 'Refresh Recommendations' : 'Get Recommendations'}
              </Button>
            )}

            {/* Quick Actions */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Quick Actions
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <Link
                    to="/search"
                    className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-zinc-200 text-sm">Explore Projects</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </Link>
                  <Link
                    to="/skills"
                    className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-zinc-200 text-sm">Manage Skills</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </Link>
                  <a
                    href={user?.profileUrl || `https://github.com/${user?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderGit2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-zinc-200 text-sm">Your Repositories</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </a>
                </div>
              </Card.Content>
            </Card>

            {/* Member Since */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Member since</p>
                  <p className="text-zinc-200 text-sm font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : 'Recently joined'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contributions & Recommendations */}
          <div className="space-y-6">
            {/* Contribution Graph */}
            <Card>
              <Card.Header>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-emerald-400" />
                      Contributions
                    </Card.Title>
                    <Card.Description className="mt-0.5">
                      {contributionStats.total} in the last year
                    </Card.Description>
                  </div>
                  <div className="flex gap-5">
                    <div>
                      <div className="text-lg font-semibold text-zinc-100">{contributionStats.total}</div>
                      <div className="text-zinc-500 text-xs">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-emerald-400">{contributionStats.currentStreak}</div>
                      <div className="text-zinc-500 text-xs">Streak</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-amber-400">{contributionStats.longestStreak}</div>
                      <div className="text-zinc-500 text-xs">Best</div>
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {loadingContributions ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : contributionData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="inline-flex gap-1">
                      {contributionData.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1">
                          {week.map((day, dayIndex) => {
                            const colors = [
                              'bg-zinc-800/60',
                              'bg-emerald-900/50',
                              'bg-emerald-700/60',
                              'bg-emerald-500/80',
                              'bg-emerald-400',
                            ];
                            return (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`w-2.5 h-2.5 rounded-sm ${colors[day.level]} hover:ring-1 hover:ring-emerald-400/50 transition-all cursor-pointer`}
                                title={`${day.date}: ${day.count} contributions`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-500">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900/50" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 text-sm">No contribution data available</p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Recommended Projects */}
            <Card padding="none">
              <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-400" />
                      Recommendations
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
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

              <div className="px-7 sm:px-8 py-7 sm:py-8">
                {loadingRecommendations ? (
                  <div className="space-y-6">
                    {Array(3).fill(null).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-6">
                    {recommendations.map((repo) => {
                      if (!repo || !repo.owner) return null;

                      return (
                        <div
                          key={repo.id}
                          className="group p-5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <img
                                  src={repo.owner.avatarUrl}
                                  alt={repo.owner.login}
                                  className="w-6 h-6 rounded-full"
                                />
                                <Link
                                  to={`/repository/${repo.fullName}`}
                                  className="text-zinc-200 text-sm font-medium hover:text-indigo-400 transition-colors truncate"
                                >
                                  {repo.fullName}
                                </Link>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getDifficultyColor(repo.difficulty)}`}>
                                  {repo.difficulty}
                                </span>
                              </div>
                              <p className="text-zinc-500 text-xs mb-2 line-clamp-2">
                                {repo.description || 'No description available'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                {repo.language && (
                                  <span className="flex items-center gap-1">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                                    />
                                    <span className="text-zinc-500">{repo.language}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-zinc-500">
                                  <Star className="w-3 h-3" />
                                  {formatNumber(repo.stars)}
                                </span>
                                <span className="flex items-center gap-1 text-zinc-500">
                                  <GitFork className="w-3 h-3" />
                                  {formatNumber(repo.forks)}
                                </span>
                                <span className="text-indigo-400 text-[10px] px-1.5 py-0.5 bg-indigo-500/10 rounded">
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">
                      {skills.length > 0 ? 'Ready for recommendations' : 'No skills added yet'}
                    </h3>
                    <p className="text-zinc-500 text-xs max-w-xs mx-auto mb-4">
                      {skills.length > 0
                        ? 'Click the button on the left to get AI-powered project recommendations.'
                        : 'Add your skills to get personalized recommendations.'}
                    </p>
                    {skills.length === 0 && (
                      <Button
                        as={Link}
                        to="/skills"
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                      >
                        Add Skills
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default DashboardPage;
