import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

export const configurePassport = (passport) => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // GitHub OAuth Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID || 'your-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-client-secret',
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
        scope: ['user:email', 'read:user'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            // Update user info
            user.accessToken = accessToken;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || null,
            avatar: profile.photos?.[0]?.value || null,
            profileUrl: profile.profileUrl,
            accessToken: accessToken,
            bio: profile._json?.bio || null,
            company: profile._json?.company || null,
            location: profile._json?.location || null,
            publicRepos: profile._json?.public_repos || 0,
            followers: profile._json?.followers || 0,
            following: profile._json?.following || 0,
          });

          return done(null, user);
        } catch (error) {
          console.error('GitHub auth error:', error);
          return done(error, null);
        }
      }
    )
  );
};

export default configurePassport;
