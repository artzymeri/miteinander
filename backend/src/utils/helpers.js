/**
 * Format success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Format error response
 */
const errorResponse = (res, message, statusCode = 400, errorCode = 'ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};

/**
 * User role types
 */
const USER_ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  CARE_RECIPIENT: 'care_recipient',
  CARE_GIVER: 'care_giver',
};

/**
 * Get model by role
 */
const getModelByRole = (role, models) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return models.Admin;
    case USER_ROLES.SUPPORT:
      return models.Support;
    case USER_ROLES.CARE_RECIPIENT:
      return models.CareRecipient;
    case USER_ROLES.CARE_GIVER:
      return models.CareGiver;
    default:
      return null;
  }
};

/**
 * Pagination helpers
 */
const getPagination = (page, size) => {
  const limit = size ? +size : 20;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

module.exports = {
  successResponse,
  errorResponse,
  USER_ROLES,
  getModelByRole,
  getPagination,
  getPagingData,
};
