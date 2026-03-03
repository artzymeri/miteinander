const { Sequelize } = require('sequelize');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Use SSL for any remote database (not localhost)
const isRemoteDB = config.db.host && config.db.host !== 'localhost' && config.db.host !== '127.0.0.1';

let sslDialectOptions = {};
if (isRemoteDB) {
  const caPath = path.join(__dirname, 'ca-certificate.crt');
  const caExists = fs.existsSync(caPath);

  sslDialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: caExists,
      ...(caExists && { ca: fs.readFileSync(caPath) }),
    },
    authPlugins: {
      caching_sha2_password: () => () => Buffer.from(config.db.password + '\0'),
    },
  };
}

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.server.env === 'development' ? console.log : false,
    dialectOptions: sslDialectOptions,
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
      dialectOptions: sslDialectOptions,
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
