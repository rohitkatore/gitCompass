import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Github, LogOut, Search, Compass, LayoutDashboard, Zap, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const Navbar = ({ user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/search', label: 'Explore', icon: Search },
    { path: '/skills', label: 'Skills', icon: Zap },
    { path: '/ai', label: 'AI Bot', icon: Bot },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200',
        isScrolled
          ? 'bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800'
          : 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Compass className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-semibold text-zinc-100">
              GitCompass
            </span>
          </Link>

          {/* Desktop Navigation — compact pill style */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center bg-zinc-900/60 rounded-lg p-1 border border-zinc-800/50">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}>
                    <div
                      className={cn(
                        'relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'text-zinc-100 bg-zinc-800'
                          : 'text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar || `https://github.com/${user.username}.png`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full ring-1 ring-zinc-700"
                  />
                  <span className="text-sm text-zinc-400">{user.username}</span>
                </div>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={onLogout}>
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
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden bg-zinc-950 border-b border-zinc-800"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'text-zinc-100 bg-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-3 mt-3 border-t border-zinc-800">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-3">
                      <img
                        src={user.avatar || `https://github.com/${user.username}.png`}
                        alt={user.username}
                        className="w-7 h-7 rounded-full ring-1 ring-zinc-700"
                      />
                      <span className="text-sm text-zinc-300">{user.username}</span>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full" icon={LogOut} onClick={onLogout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
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
    </nav>
  );
};

export default Navbar;
