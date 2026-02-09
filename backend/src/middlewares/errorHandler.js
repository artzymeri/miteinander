const config = require('../config/config');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with this value already exists';
    errorCode = 'DUPLICATE_ERROR';
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }
  
  // Don't leak error details in production
  if (config.server.env === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(config.server.env === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
