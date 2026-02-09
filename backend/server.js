require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const config = require('./src/config/config');
const { initializeDatabase, testConnection } = require('./src/config/database');
const { migrate, getPendingMigrations } = require('./src/migrations/runner');
const { setupSocket } = require('./src/socket');

const startServer = async () => {
  console.log('\n🚀 Starting Miteinander Backend Server...\n');
  
  try {
    // Step 1: Initialize database (create if not exists)
    console.log('📦 Initializing database...');
    await initializeDatabase();
    
    // Step 2: Test database connection
    console.log('🔌 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Could not connect to database');
    }
    
    // Step 3: Check and run pending migrations
    console.log('📋 Checking for pending migrations...');
    const pendingMigrations = await getPendingMigrations();
    
    if (pendingMigrations.length > 0) {
      console.log(`  Found ${pendingMigrations.length} pending migration(s). Running...`);
      await migrate();
    } else {
      console.log('  ✨ No pending migrations.\n');
    }
    
    // Step 4: Load models (sync associations)
    console.log('📚 Loading models...');
    require('./src/models');
    console.log('  ✅ Models loaded.\n');
    
    // Step 5: Create HTTP server and attach Socket.IO
    const PORT = config.server.port;
    const httpServer = http.createServer(app);
    
    console.log('🔌 Setting up Socket.IO...');
    setupSocket(httpServer);
    console.log('  ✅ Socket.IO ready.\n');
    
    httpServer.listen(PORT, () => {
      console.log('═'.repeat(50));
      console.log(`🎉 Server is running!`);
      console.log(`📍 Local:    http://localhost:${PORT}`);
      console.log(`📍 API:      http://localhost:${PORT}/api`);
      console.log(`📍 Socket:   ws://localhost:${PORT}`);
      console.log(`📍 Health:   http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${config.server.env}`);
      console.log('═'.repeat(50));
      console.log('\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
