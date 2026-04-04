import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'gitcompass-jwt-secret';

// Authentication middleware — supports JWT Bearer tokens and Passport sessions
export const isAuthenticated = async (req, res, next) => {
  // Check JWT Bearer token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = user; // set req.user so downstream handlers work normally
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  // Fallback: Passport session
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in.',
  });
};

export const optionalAuth = (req, res, next) => {
  // Continue regardless of authentication status
  // User info will be available if authenticated
  next();
};

export default { isAuthenticated, optionalAuth };
