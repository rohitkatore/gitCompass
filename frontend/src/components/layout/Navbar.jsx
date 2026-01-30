import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Github, LogOut, User, Search, Compass, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const Navbar = ({ user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: Compass },
    { path: '/search', label: 'Explore', icon: Search },
    { path: '/skills', label: 'Skills', icon: Sparkles },
    { path: '/dashboard', label: 'Dashboard', icon: User },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 50
      }}
      className={cn(
        'transition-all duration-300',
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg'
          : 'bg-slate-900/60 backdrop-blur-md'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              <Compass className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              GitCompass
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex p-2 items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || `https://github.com/${user.username}.png`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-indigo-500/50"
                  />
                  <span className="text-slate-300 font-medium">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Github}
                onClick={() => window.location.href = '/api/auth/github'}
              >
                Sign in with GitHub
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-700">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4">
                      <img
                        src={user.avatar || `https://github.com/${user.username}.png`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full border-2 border-indigo-500/50"
                      />
                      <span className="text-white font-medium">{user.username}</span>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      icon={LogOut}
                      onClick={onLogout}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={Github}
                    onClick={() => window.location.href = '/api/auth/github'}
                  >
                    Sign in with GitHub
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
