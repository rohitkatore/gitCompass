import { useState } from 'react';
import { Search as SearchIcon, Filter, Star, GitFork, Clock, Code, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { CardSkeleton } from '../components/ui/Loading';
import { formatNumber, formatRelativeTime, getLanguageColor } from '../lib/utils';

const SearchPage = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    language: '',
    minStars: '',
    topic: '',
    sortBy: 'relevance',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState([]);

  const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'Ruby', 'PHP', 'Swift'];
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'stars', label: 'Most Stars' },
    { value: 'forks', label: 'Most Forks' },
    { value: 'updated', label: 'Recently Updated' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setRepositories([
        {
          id: 1,
          name: 'react',
          fullName: 'facebook/react',
          owner: { login: 'facebook', avatarUrl: 'https://github.com/facebook.png' },
          description: 'The library for web and native user interfaces.',
          stars: 220000,
          forks: 45000,
          language: 'JavaScript',
          topics: ['react', 'javascript', 'ui', 'frontend'],
          updatedAt: '2026-01-25T10:00:00Z',
          matchScore: 95,
        },
        {
          id: 2,
          name: 'next.js',
          fullName: 'vercel/next.js',
          owner: { login: 'vercel', avatarUrl: 'https://github.com/vercel.png' },
          description: 'The React Framework for the Web',
          stars: 118000,
          forks: 25000,
          language: 'JavaScript',
          topics: ['nextjs', 'react', 'framework', 'ssr'],
          updatedAt: '2026-01-24T15:30:00Z',
          matchScore: 88,
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  const clearFilters = () => {
    setFilters({ language: '', minStars: '', topic: '', sortBy: 'relevance' });
  };

  const fieldClass = "w-full h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div className="w-full py-12">
      <Container size="lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-100 mb-3">Explore Repositories</h1>
          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed text-center">
            Search through millions of open-source projects and find the perfect match for your skills.
          </p>
        </div>

        {/* Search Bar — input and buttons share h-10 */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description, or technology..."
              className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button type="submit" size="md" loading={loading}>
              Search
            </Button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-zinc-200">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Language</label>
                <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className={fieldClass}>
                  <option value="">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Min Stars</label>
                <input type="number" value={filters.minStars} onChange={(e) => setFilters({ ...filters, minStars: e.target.value })} placeholder="e.g., 1000" className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Topic</label>
                <input type="text" value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} placeholder="e.g., machine-learning" className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1.5">Sort By</label>
                <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className={fieldClass}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex flex-col gap-4">
          {loading ? (
            Array(3).fill(null).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : repositories.length > 0 ? (
            repositories.map((repo) => (
              <Card key={repo.id} hover>
                <div className="flex flex-wrap gap-4">
                  <img
                    src={repo.owner.avatarUrl}
                    alt={repo.owner.login}
                    className="w-10 h-10 rounded-lg border border-zinc-800"
                  />
                  <div className="flex-1 min-w-50">
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <div>
                        <Link
                          to={`/repository/${repo.owner.login}/${repo.name}`}
                          className="text-sm font-semibold text-zinc-100 hover:text-indigo-400 transition-colors"
                        >
                          {repo.fullName}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5">{repo.description}</p>
                      </div>
                      <span className="shrink-0 text-xs text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded border border-indigo-500/20">
                        {repo.matchScore}% match
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <span key={topic} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                          #{topic}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> {formatNumber(repo.stars)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" /> {formatNumber(repo.forks)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(repo.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mb-4">
                <Code className="w-7 h-7 text-zinc-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200 mb-1">Start your search</h3>
              <p className="text-sm text-zinc-500">Enter a query to find repositories</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default SearchPage;
