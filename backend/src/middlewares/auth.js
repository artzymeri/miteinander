const { verifyToken } = require('../utils/jwt');
const { errorResponse, getModelByRole } = require('../utils/helpers');
const models = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401, 'NO_TOKEN');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      
      // Get user from database based on role
      const Model = getModelByRole(decoded.role, models);
      
      if (!Model) {
        return errorResponse(res, 'Invalid user role', 401, 'INVALID_ROLE');
      }
      
      const user = await Model.findByPk(decoded.id);
      
      if (!user) {
        return errorResponse(res, 'User not found', 401, 'USER_NOT_FOUND');
      }
      
      if (!user.isActive) {
        return errorResponse(res, 'Account is deactivated', 401, 'ACCOUNT_INACTIVE');
      }
      
      // Attach user and role to request
      req.user = user;
      req.userRole = decoded.role;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed', 500, 'AUTH_ERROR');
  }
};

/**
 * Optional authentication
 * Continues even if no token provided
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuth,
};
