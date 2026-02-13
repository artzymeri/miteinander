# Backend Development Guidelines - MyHelper Platform

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize v6
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi / express-validator

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Sequelize connection config
│   │   └── config.js         # Environment variables
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.js           # JWT verification
│   │   ├── errorHandler.js   # Global error handler
│   │   └── roleGuard.js      # Role-based access control
│   ├── models/
│   │   ├── index.js          # Sequelize instance & model loader
│   │   ├── Admin.js
│   │   ├── Support.js
│   │   ├── CareRecipient.js
│   │   └── CareGiver.js
│   ├── routes/
│   │   ├── index.js          # Route aggregator
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── services/             # Business logic layer
│   ├── utils/
│   │   ├── jwt.js
│   │   └── helpers.js
│   └── app.js                # Express app setup
├── migrations/               # Sequelize migrations
│   └── tracker/              # Migration tracking files
├── seeders/                  # Database seeders
├── .env                      # Environment variables (not in git)
├── .env.example              # Example environment file
├── package.json
└── server.js                 # Entry point
```

---

## Database Configuration

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=myhelper

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

PORT=5000
```

---

## User Types & Tables

### 1. Admins
- Full platform access
- User management capabilities
- System configuration access

### 2. Support
- Customer support access
- Limited admin capabilities
- Can view/manage user issues

### 3. CareRecipient
- Users receiving care
- Can search/book caregivers
- Manage their care schedule

### 4. CareGiver
- Users providing care
- Profile and availability management
- Accept/manage care requests

---

## Migration System

### Philosophy
**Zero-downtime migrations with tracking**

Every migration is:
1. Tracked in the database (`MigrationMeta` table)
2. Tracked in files (`migrations/tracker/`)
3. Executed sequentially by timestamp
4. Reversible (up/down methods)

### Migration Workflow

1. **Create Migration**:
   ```bash
   npm run migration:create -- --name=create_admins_table
   ```

2. **Run Pending Migrations** (automatic on `npm start`):
   ```bash
   npm run migrate
   ```

3. **Rollback Last Migration**:
   ```bash
   npm run migrate:undo
   ```

4. **Check Status**:
   ```bash
   npm run migrate:status
   ```

### Migration File Template
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TableName', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... columns
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TableName');
  },
};
```

### Startup Migration Check
On every `npm start`:
1. Connect to database
2. Check `MigrationMeta` table for executed migrations
3. Compare with migration files
4. Execute any pending migrations in order
5. Start the server

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Authentication Flow

1. User registers → Password hashed (bcrypt) → User created → JWT returned
2. User logs in → Credentials verified → JWT returned
3. Protected routes → JWT verified via middleware → Access granted/denied

### JWT Payload
```javascript
{
  id: user.id,
  email: user.email,
  role: 'admin' | 'support' | 'care_recipient' | 'care_giver',
  iat: timestamp,
  exp: timestamp
}
```

---

## Coding Standards

### Model Definition
```javascript
module.exports = (sequelize, DataTypes) => {
  const ModelName = sequelize.define('ModelName', {
    // Fields
  }, {
    tableName: 'table_name',
    timestamps: true,
    underscored: true, // Use snake_case in DB
  });

  ModelName.associate = (models) => {
    // Define associations
  };

  return ModelName;
};
```

### Controller Pattern
```javascript
const getAll = async (req, res, next) => {
  try {
    const items = await Service.getAll();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
```

### Error Handling
- Use custom error classes
- Centralized error handler middleware
- Never expose stack traces in production

---

## Security Checklist

- [ ] Environment variables for secrets
- [ ] Password hashing (bcrypt, min 10 rounds)
- [ ] JWT with appropriate expiry
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Sequelize parameterized queries)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration
- [ ] Helmet.js for HTTP headers

---

## ⚠️ CRITICAL SECURITY MEASURES - CHECK ON EVERY CHANGE

### IDOR (Insecure Direct Object Reference) Prevention
**ALWAYS verify resource ownership before allowing access!**

```javascript
// ❌ VULNERABLE - Never do this
const getProfile = async (req, res) => {
  const userId = req.params.id; // User can change this to any ID!
  const user = await User.findByPk(userId);
  res.json(user);
};

// ✅ SECURE - Always verify ownership
const getProfile = async (req, res) => {
  const requestedId = parseInt(req.params.id);
  const authenticatedUserId = req.user.id;
  
  // Verify the user can only access their own data
  if (requestedId !== authenticatedUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const user = await User.findByPk(requestedId);
  res.json(user);
};
```

**IDOR Checklist for every endpoint:**
- [ ] Is `req.params.id` validated against `req.user.id`?
- [ ] Can users access/modify other users' resources?
- [ ] Are admin-only endpoints protected with role checks?
- [ ] Are nested resources validated (e.g., user's appointments)?

### RCE (Remote Code Execution) Prevention
**NEVER execute user-controlled input!**

```javascript
// ❌ EXTREMELY DANGEROUS - Never do this
eval(req.body.code);
exec(req.body.command);
require(req.body.module);
new Function(req.body.script)();

// ❌ DANGEROUS - File path manipulation
const filePath = path.join('/uploads', req.body.filename);
// User could send "../../../etc/passwd"

// ✅ SECURE - Sanitize and validate
const sanitizedFilename = path.basename(req.body.filename);
const filePath = path.join('/uploads', sanitizedFilename);
```

**RCE Prevention Checklist:**
- [ ] No `eval()`, `exec()`, `spawn()` with user input
- [ ] No dynamic `require()` or `import()` with user input
- [ ] No `new Function()` with user input
- [ ] File paths sanitized with `path.basename()`
- [ ] Template engines configured to escape by default

### SQL Injection Prevention
```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;

// ✅ SECURE - Use Sequelize parameterized queries
const user = await User.findOne({ where: { email: req.body.email } });

// ✅ SECURE - Raw queries with replacements
const [results] = await sequelize.query(
  'SELECT * FROM users WHERE email = ?',
  { replacements: [req.body.email] }
);
```

### Mass Assignment Prevention
```javascript
// ❌ VULNERABLE - User can set isAdmin: true
await User.update(req.body, { where: { id: userId } });

// ✅ SECURE - Whitelist allowed fields
const { firstName, lastName, email } = req.body;
await User.update({ firstName, lastName, email }, { where: { id: userId } });
```

### Authentication & Authorization
```javascript
// ALWAYS check authentication first, then authorization
router.get('/admin/users', 
  authMiddleware,           // 1. Is user logged in?
  roleGuard(['admin']),     // 2. Is user authorized?
  userController.getAllUsers
);
```

### Input Validation
```javascript
// Validate ALL user input
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  // Set max lengths to prevent DoS
});
```

### Security Review Questions (Ask Before Every Commit)
1. **Can a user access another user's data?** → Check IDOR
2. **Is any user input executed as code?** → Check RCE
3. **Is user input used in SQL/file paths?** → Check injection
4. **Can users modify fields they shouldn't?** → Check mass assignment
5. **Are all endpoints properly authenticated?** → Check auth middleware
6. **Are admin routes protected?** → Check role guards

