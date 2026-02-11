const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_super_admin',
    },
    resetPasswordCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'reset_password_code',
    },
    resetPasswordCodeExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_code_expires_at',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
  }, {
    tableName: 'admins',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed('password')) {
          admin.password = await bcrypt.hash(admin.password, 10);
        }
      },
    },
  });

  // Instance methods
  Admin.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  Admin.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.resetPasswordCode;
    delete values.resetPasswordCodeExpiresAt;
    return values;
    // Add associations here when needed
  };

  return Admin;
};
