import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, Star, GitFork, Clock, Code, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
    },
    heading: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '16px',
      textAlign: 'center',
    },
    subheading: {
      fontSize: '16px',
      color: '#94a3b8',
      textAlign: 'center',
      maxWidth: '640px',
      margin: '0 auto 40px',
    },
    searchContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '32px',
    },
    searchInputWrapper: {
      flex: '1',
      minWidth: '300px',
      position: 'relative',
    },
    searchInput: {
      width: '100%',
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(71, 85, 105, 1)',
      borderRadius: '12px',
      padding: '16px 16px 16px 48px',
      color: '#ffffff',
      fontSize: '16px',
      outline: 'none',
    },
    searchIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#94a3b8',
      width: '20px',
      height: '20px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 0',
    },
    emptyIcon: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
    },
  };

  return (
    <div style={{ width: '100%', padding: '32px 0' }}>
      <div style={styles.container}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <h1 style={styles.heading}>Explore Repositories</h1>
          <p style={styles.subheading}>
            Search through millions of open-source projects and find the perfect match for your skills.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          style={styles.searchContainer}
        >
          <div style={styles.searchInputWrapper}>
            <SearchIcon style={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories by name, description, or technology..."
              style={styles.searchInput}
            />
          </div>
          <div style={styles.buttonGroup}>
            <Button
              type="button"
              variant="secondary"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button type="submit" loading={loading}>
              Search
            </Button>
          </div>
        </motion.form>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>Filters</h3>
                <button
                  onClick={clearFilters}
                  style={{ fontSize: '14px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Language Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
                    Language
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">All Languages</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Min Stars */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
                    Minimum Stars
                  </label>
                  <input
                    type="number"
                    value={filters.minStars}
                    onChange={(e) => setFilters({ ...filters, minStars: e.target.value })}
                    placeholder="e.g., 1000"
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Topic */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
                    Topic
                  </label>
                  <input
                    type="text"
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    placeholder="e.g., machine-learning"
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            Array(3).fill(null).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : repositories.length > 0 ? (
            repositories.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="group">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <img
                      src={repo.owner.avatarUrl}
                      alt={repo.owner.login}
                      style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid #475569' }}
                    />
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                        <div>
                          <a
                            href={`/repository/${repo.owner.login}/${repo.name}`}
                            style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', textDecoration: 'none' }}
                          >
                            {repo.fullName}
                          </a>
                          <p style={{ color: '#94a3b8', marginTop: '4px' }}>{repo.description}</p>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}>
                          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }}>{repo.matchScore}</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Match</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {repo.topics.slice(0, 5).map((topic) => (
                          <span
                            key={topic}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(51, 65, 85, 0.5)',
                              color: '#cbd5e1',
                              fontSize: '12px',
                            }}
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#94a3b8' }}>
                        {repo.language && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getLanguageColor(repo.language) }} />
                            {repo.language}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star style={{ width: '16px', height: '16px' }} />
                          {formatNumber(repo.stars)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <GitFork style={{ width: '16px', height: '16px' }} />
                          {formatNumber(repo.forks)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '16px', height: '16px' }} />
                          Updated {formatRelativeTime(repo.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Code style={{ width: '40px', height: '40px', color: '#475569' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Start your search</h3>
              <p style={{ color: '#94a3b8' }}>Enter a search query to find repositories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
