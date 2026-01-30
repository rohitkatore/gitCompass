import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import Button from '../components/ui/Button';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25"
          >
            <Github className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">
            Sign in with your GitHub account to continue
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8"
        >
          <Button
            size="lg"
            icon={Github}
            className="w-full"
            onClick={() => window.location.href = '/api/auth/github'}
          >
            Continue with GitHub
          </Button>

          <p className="text-xs text-slate-500 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            We only request read access to your public profile.
          </p>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Don't have a GitHub account?{' '}
            <a
              href="https://github.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create one for free
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
