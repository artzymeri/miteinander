const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/config');

const MIGRATIONS_DIR = path.join(__dirname, 'files');
const TRACKER_FILE = path.join(__dirname, 'tracker', 'migrations.json');

// Ensure directories exist
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(TRACKER_FILE))) {
  fs.mkdirSync(path.dirname(TRACKER_FILE), { recursive: true });
}

// Initialize tracker file if doesn't exist
if (!fs.existsSync(TRACKER_FILE)) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify({ executed: [] }, null, 2));
}

// Create sequelize instance
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
  }
);

// Migration Meta table for DB tracking
const createMigrationMetaTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migration_meta (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get executed migrations from DB
const getExecutedMigrations = async () => {
  try {
    const [rows] = await sequelize.query('SELECT name FROM migration_meta ORDER BY id ASC');
    return rows.map(r => r.name);
  } catch (error) {
    return [];
  }
};

// Get all migration files
const getMigrationFiles = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js'))
    .sort();
};

// Get pending migrations
const getPendingMigrations = async () => {
  const executed = await getExecutedMigrations();
  const all = getMigrationFiles();
  return all.filter(m => !executed.includes(m));
};

// Run a single migration
const runMigration = async (filename, direction = 'up') => {
  const migrationPath = path.join(MIGRATIONS_DIR, filename);
  const migration = require(migrationPath);
  
  const queryInterface = sequelize.getQueryInterface();
  
  if (direction === 'up') {
    await migration.up(queryInterface, Sequelize);
    await sequelize.query(
      'INSERT INTO migration_meta (name) VALUES (?)',
      { replacements: [filename] }
    );
    
    // Update local tracker
    const tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    if (!tracker.executed.includes(filename)) {
      tracker.executed.push(filename);
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    }
    
    console.log(`  ✅ Migrated: ${filename}`);
  } else {
    await migration.down(queryInterface, Sequelize);
    await sequelize.query(
      'DELETE FROM migration_meta WHERE name = ?',
      { replacements: [filename] }
    );
    
    // Update local tracker
    const tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    tracker.executed = tracker.executed.filter(m => m !== filename);
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    
    console.log(`  ↩️  Reverted: ${filename}`);
  }
};

// Run all pending migrations
const migrate = async () => {
  console.log('\n🔄 Running migrations...\n');
  
  await createMigrationMetaTable();
  const pending = await getPendingMigrations();
  
  if (pending.length === 0) {
    console.log('  ✨ No pending migrations.\n');
    return { success: true, count: 0 };
  }
  
  console.log(`  Found ${pending.length} pending migration(s):\n`);
  
  for (const migration of pending) {
    await runMigration(migration, 'up');
  }
  
  console.log(`\n✅ Successfully ran ${pending.length} migration(s).\n`);
  return { success: true, count: pending.length };
};

// Undo last migration
const undo = async () => {
  console.log('\n🔄 Reverting last migration...\n');
  
  await createMigrationMetaTable();
  const executed = await getExecutedMigrations();
  
  if (executed.length === 0) {
    console.log('  ❌ No migrations to revert.\n');
    return { success: false };
  }
  
  const lastMigration = executed[executed.length - 1];
  await runMigration(lastMigration, 'down');
  
  console.log('\n✅ Successfully reverted migration.\n');
  return { success: true };
};

// Show migration status
const status = async () => {
  console.log('\n📊 Migration Status\n');
  
  await createMigrationMetaTable();
  const executed = await getExecutedMigrations();
  const all = getMigrationFiles();
  
  if (all.length === 0) {
    console.log('  No migrations found.\n');
    return;
  }
  
  console.log('  Status    | Migration');
  console.log('  ----------|--------------------------------------------------');
  
  for (const migration of all) {
    const isExecuted = executed.includes(migration);
    const status = isExecuted ? '✅ Done  ' : '⏳ Pending';
    console.log(`  ${status} | ${migration}`);
  }
  
  const pending = all.filter(m => !executed.includes(m));
  console.log(`\n  Total: ${all.length} | Executed: ${executed.length} | Pending: ${pending.length}\n`);
};

// Create a new migration
const create = async (name) => {
  if (!name) {
    console.error('❌ Please provide a migration name: npm run migration:create -- --name=migration_name');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name}.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  const template = `'use strict';

/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add migration logic here
    // Example:
    // await queryInterface.createTable('table_name', {
    //   id: {
    //     type: Sequelize.INTEGER,
    //     primaryKey: true,
    //     autoIncrement: true,
    //   },
    //   created_at: {
    //     type: Sequelize.DATE,
    //     allowNull: false,
    //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    //   },
    //   updated_at: {
    //     type: Sequelize.DATE,
    //     allowNull: false,
    //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    //   },
    // });
  },

  down: async (queryInterface, Sequelize) => {
    // Add revert logic here
    // Example:
    // await queryInterface.dropTable('table_name');
  },
};
`;

  fs.writeFileSync(filepath, template);
  console.log(`\n✅ Created migration: ${filename}\n`);
};

// CLI handler
const run = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    await sequelize.authenticate();
    
    switch (command) {
      case 'migrate':
        await migrate();
        break;
      case 'undo':
        await undo();
        break;
      case 'status':
        await status();
        break;
      case 'create':
        const nameArg = args.find(a => a.startsWith('--name='));
        const name = nameArg ? nameArg.split('=')[1] : null;
        await create(name);
        break;
      default:
        console.log('Usage: node runner.js [migrate|undo|status|create --name=migration_name]');
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Export for programmatic use
module.exports = {
  migrate,
  undo,
  status,
  create,
  getPendingMigrations,
  sequelize,
};

// Run if called directly
if (require.main === module) {
  run();
}
