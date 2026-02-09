require('dotenv').config();

module.exports = {
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'miteinander',
    dialect: 'mysql',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    env: process.env.NODE_ENV || 'development',
  },
};
