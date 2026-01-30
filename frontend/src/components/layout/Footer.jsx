import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Heart, Compass } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API', href: '/api' },
        { label: 'Support', href: '/support' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'License', href: '/license' },
      ],
    },
  ];

  return (
    <footer style={{ 
      position: 'relative',
      backgroundColor: '#0f172a',
      borderTop: '1px solid rgba(51, 65, 85, 0.5)'
    }}>
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, transparent, rgba(2, 6, 23, 0.5))',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        position: 'relative',
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '3rem 1rem'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}>
          {/* Brand section */}
          <div style={{ gridColumn: 'span 2', minWidth: '280px' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(to bottom right, #6366f1, #8b5cf6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Compass style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>GitCompass</span>
            </motion.div>
            
            <p style={{ 
              color: '#94a3b8',
              marginBottom: '1.5rem',
              maxWidth: '28rem',
              lineHeight: '1.6'
            }}>
              Discover open-source projects that match your skills. 
              AI-powered recommendations to kickstart your contribution journey.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '0.5rem',
                      backgroundColor: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      border: '1px solid transparent',
                      transition: 'all 0.3s'
                    }}
                    className="hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50"
                  >
                    <Icon style={{ width: '20px', height: '20px' }} />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Links sections */}
          {footerLinks.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 style={{ 
                color: 'white',
                fontWeight: '600',
                marginBottom: '1.5rem',
                fontSize: '1rem'
              }}>
                {section.title}
              </h3>
              <ul style={{ 
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                      }}
                      className="hover:text-indigo-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{ 
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              © {currentYear} GitCompass. All rights reserved.
            </p>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#64748b',
                fontSize: '0.875rem'
              }}
            >
              Made with
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart style={{ width: '16px', height: '16px', color: '#ef4444', fill: '#ef4444' }} />
              </motion.span>
              for open source
            </motion.p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
