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
import Container from '../components/ui/Container';

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
      <section className="w-full pt-16 pb-12">
        <Container size="md">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Open Source Discovery
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl font-bold text-zinc-100 leading-tight mb-4 max-w-2xl text-balance">
              Find Your Perfect{' '}
              <span className="text-indigo-400">Open Source Match</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-zinc-400 max-w-2xl mb-8 leading-relaxed">
              Upload your resume and let AI discover open-source projects that align with your skills.
              Get personalized contribution guides to make your first PR effortlessly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
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
        </Container>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 border-t border-b border-zinc-800/60 bg-zinc-900/30">
        <Container size="lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-indigo-400 mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{stat.value}</div>
                  <div className="text-xs text-zinc-400 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="w-full py-24">
        <Container size="lg">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">How It Works</h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Our AI-powered platform simplifies your journey into open source in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.step}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors text-center flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-2 whitespace-nowrap">
                    Step {feature.step}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="w-full pb-24">
        <Container size="lg">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-8 py-16 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">
              Ready to Start Contributing?
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mb-8 leading-relaxed">
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
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
