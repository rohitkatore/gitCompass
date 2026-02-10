import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Upload,
  Search,
  Sparkles,
  BookOpen,
  Github,
  Star,
  GitFork,
  Users,
  Target,
  Brain,
  Compass
} from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage = ({ user }) => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Upload your resume and let AI extract your technical skills automatically.',
      step: 1,
    },
    {
      icon: Brain,
      title: 'Smart Matching',
      description: 'Sentence-BERT finds repositories that match your skills semantically.',
      step: 2,
    },
    {
      icon: Target,
      title: 'Personalized Results',
      description: 'Get ranked repositories based on your profile, popularity, and activity.',
      step: 3,
    },
    {
      icon: BookOpen,
      title: 'Contribution Guide',
      description: 'Receive step-by-step guidance on how to make your first contribution.',
      step: 4,
    },
  ];

  const stats = [
    { label: 'Repos Indexed', value: '10M+', icon: Github },
    { label: 'Skills Recognized', value: '500+', icon: Sparkles },
    { label: 'Contributors', value: '50K+', icon: Users },
    { label: 'Successful PRs', value: '100K+', icon: GitFork },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-16 sm:px-20 lg:px-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Open Source Discovery
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 leading-tight mb-5">
            Find Your Perfect{' '}
            <span className="text-indigo-400">Open Source Match</span>
          </h1>

          {/* Subheading */}
          <p className="text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your resume and let AI discover open-source projects that align with your skills.
            Get personalized contribution guides to make your first PR effortlessly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="md" icon={Compass}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button
                size="md"
                icon={Github}
                onClick={() => window.location.href = '/api/auth/github'}
              >
                Get Started with GitHub
              </Button>
            )}
            <Link to="/search">
              <Button variant="secondary" size="md" icon={Search}>
                Explore Repositories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 border-t border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-16 sm:px-20 lg:px-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 text-indigo-400 mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-24">
        <div className="max-w-6xl mx-auto px-16 sm:px-20 lg:px-32">
          <div className="text-center mb-20">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">How It Works</h2>
            <p className="text-sm text-zinc-500 max-w-lg mx-auto">
              Our AI-powered platform simplifies your journey into open source in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.step}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-7 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-4.5 h-4.5 text-indigo-400" strokeWidth={2} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-1.5">
                    Step {feature.step}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full pb-24">
        <div className="max-w-5xl mx-auto px-16 sm:px-20 lg:px-32">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-8 py-16 text-center">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">
              Ready to Start Contributing?
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Join thousands of developers who found their perfect open-source projects.
              Your first contribution is just a click away.
            </p>
            <Button
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => window.location.href = user ? '/dashboard' : '/api/auth/github'}
            >
              {user ? 'Go to Dashboard' : 'Start Your Journey'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
