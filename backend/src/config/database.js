const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.server.env === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Initialize database (create if not exists)
const initializeDatabase = async () => {
  const tempSequelize = new Sequelize(
    '',
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: config.db.dialect,
      logging: false,
    }
  );

  try {
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\`;`);
    console.log(`✅ Database '${config.db.name}' is ready.`);
    await tempSequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    await tempSequelize.close();
    return false;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  initializeDatabase,
};
