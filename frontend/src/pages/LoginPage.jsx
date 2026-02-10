import { Github } from 'lucide-react';
import Button from '../components/ui/Button';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-6">
            <Github className="w-7 h-7 text-white" />
          </div>
          
          <h1 className="text-xl font-semibold text-zinc-100 mb-2">Welcome Back</h1>
          <p className="text-sm text-zinc-500">
            Sign in with your GitHub account to continue
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <Button
            size="md"
            icon={Github}
            className="w-full"
            onClick={() => window.location.href = '/api/auth/github'}
          >
            Continue with GitHub
          </Button>

          <p className="text-[11px] text-zinc-600 text-center mt-5 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            We only request read access to your public profile.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-zinc-600 text-xs">
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
      </div>
    </div>
  );
};

export default LoginPage;
