import { motion } from 'framer-motion';
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
      title: 'Upload Your Resume',
      description: 'Simply upload your resume and let our AI extract your technical skills automatically.',
      color: '#60a5fa',
      step: 1,
    },
    {
      icon: Brain,
      title: 'Smart Matching',
      description: 'Our Sentence-BERT model finds repositories that match your skills semantically.',
      color: '#ec4899',
      step: 2,
    },
    {
      icon: Target,
      title: 'Personalized Results',
      description: 'Get ranked repositories based on your profile, popularity, and recent activity.',
      color: '#f97316',
      step: 3,
    },
    {
      icon: BookOpen,
      title: 'AI Contribution Guide',
      description: 'Receive step-by-step guidance on how to make your first contribution.',
      color: '#10b981',
      step: 4,
    },
  ];

  const stats = [
    { label: 'Repositories Indexed', value: '10M+', icon: Github },
    { label: 'Skills Recognized', value: '500+', icon: Sparkles },
    { label: 'Contributors Matched', value: '50K+', icon: Users },
    { label: 'Successful PRs', value: '100K+', icon: GitFork },
  ];

  // Styles object for consistent inline styling
  const styles = {
    container: {
      width: '100%',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 24px',
    },
    section: {
      width: '100%',
      padding: '80px 0',
    },
    heading: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '16px',
      textAlign: 'center',
    },
    subheading: {
      fontSize: '18px',
      color: '#94a3b8',
      textAlign: 'center',
      maxWidth: '672px',
      margin: '0 auto 48px',
    },
    grid4: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
    },
    grid4Responsive: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
    },
    card: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(71, 85, 105, 0.5)',
      borderRadius: '16px',
      padding: '24px',
    },
    iconBox: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    stepLabel: {
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '8px',
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '8px',
    },
    cardDescription: {
      fontSize: '14px',
      color: '#94a3b8',
      lineHeight: '1.6',
    },
    statCard: {
      textAlign: 'center',
      padding: '16px',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: '14px',
      color: '#94a3b8',
    },
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Hero Section */}
      <section style={{ ...styles.section, paddingTop: '60px' }}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center' }}
          >
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              marginBottom: '32px',
            }}>
              <Sparkles style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>AI-Powered Open Source Discovery</span>
            </div>

            {/* Main Heading */}
            <h1 style={{ fontSize: '56px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.1' }}>
              <span style={{ color: '#ffffff', display: 'block', marginBottom: '8px' }}>Find Your Perfect</span>
              <span style={{
                display: 'block',
                background: 'linear-gradient(90deg, #a78bfa 0%, #c084fc 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Open Source Match
              </span>
            </h1>

            {/* Subheading */}
            <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '40px', maxWidth: '768px', margin: '0 auto 40px', lineHeight: '1.6' }}>
              Upload your resume and let AI discover open-source projects that align with your skills.
              Get personalized contribution guides to make your first PR effortlessly.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" icon={Compass} iconPosition="left">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  icon={Github}
                  iconPosition="left"
                  onClick={() => window.location.href = '/api/auth/github'}
                >
                  Get Started with GitHub
                </Button>
              )}
              <Link to="/search">
                <Button variant="secondary" size="lg" icon={Search} iconPosition="left">
                  Explore Repositories
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        width: '100%',
        padding: '48px 0',
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
      }}>
        <div style={styles.container}>
          <div style={styles.grid4Responsive}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={styles.statCard}
                >
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    color: '#818cf8',
                    marginBottom: '12px',
                  }}>
                    <Icon style={{ width: '24px', height: '24px' }} />
                  </div>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <h2 style={styles.heading}>How It Works</h2>
            <p style={styles.subheading}>
              Our AI-powered platform simplifies your journey into open source in four simple steps.
            </p>
          </motion.div>

          {/* Feature Cards Grid - Using inline grid styles */}
          <div style={styles.grid4Responsive}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  style={styles.card}
                >
                  {/* Icon */}
                  <div style={{
                    ...styles.iconBox,
                    backgroundColor: feature.color,
                    boxShadow: `0 8px 24px ${feature.color}40`
                  }}>
                    <Icon style={{ width: '28px', height: '28px', color: '#ffffff' }} strokeWidth={2.5} />
                  </div>

                  {/* Step Label */}
                  <div style={{ ...styles.stepLabel, color: feature.color }}>
                    Step {feature.step}
                  </div>

                  {/* Title */}
                  <h3 style={styles.cardTitle}>{feature.title}</h3>

                  {/* Description */}
                  <p style={styles.cardDescription}>{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
              borderRadius: '24px',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              padding: '80px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(6, 182, 212, 0.08) 100%)',
            }}
          >
            <h2 style={{ fontSize: '42px', fontWeight: 'bold', color: '#ffffff', marginBottom: '24px' }}>
              Ready to Start Contributing?
            </h2>
            <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '40px', maxWidth: '672px', margin: '0 auto 40px', lineHeight: '1.6' }}>
              Join thousands of developers who found their perfect open-source projects.
              Your first contribution is just a click away.
            </p>
            <Button
              size="xl"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => window.location.href = user ? '/dashboard' : '/api/auth/github'}
            >
              {user ? 'Go to Dashboard' : 'Start Your Journey'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
