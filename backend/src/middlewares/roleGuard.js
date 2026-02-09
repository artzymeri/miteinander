const { errorResponse, USER_ROLES } = require('../utils/helpers');

/**
 * Role guard middleware factory
 * Restricts access to specific roles
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return errorResponse(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }
    
    if (!allowedRoles.includes(req.userRole)) {
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403, 'FORBIDDEN');
    }
    
    next();
  };
};

// Convenience middleware for specific roles
const adminOnly = requireRoles(USER_ROLES.ADMIN);
const supportOnly = requireRoles(USER_ROLES.SUPPORT);
const adminOrSupport = requireRoles(USER_ROLES.ADMIN, USER_ROLES.SUPPORT);
const careGiverOnly = requireRoles(USER_ROLES.CARE_GIVER);
const careRecipientOnly = requireRoles(USER_ROLES.CARE_RECIPIENT);
const usersOnly = requireRoles(USER_ROLES.CARE_GIVER, USER_ROLES.CARE_RECIPIENT);

module.exports = {
  requireRoles,
  adminOnly,
  supportOnly,
  adminOrSupport,
  careGiverOnly,
  careRecipientOnly,
  usersOnly,
};
