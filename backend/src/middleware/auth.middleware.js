// Authentication middleware

export const isAuthenticated = (req, res, next) => {
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
