const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Support = sequelize.define('Support', {
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
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  }, {
    tableName: 'supports',
    timestamps: true,
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (support) => {
        if (support.password) {
          support.password = await bcrypt.hash(support.password, 10);
        }
      },
      beforeUpdate: async (support) => {
        if (support.changed('password')) {
          support.password = await bcrypt.hash(support.password, 10);
        }
      },
    },
  });

  // Instance methods
  Support.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  Support.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.resetPasswordCode;
    delete values.resetPasswordCodeExpiresAt;
    delete values.deletedAt;
    return values;
    // Add associations here when needed
  };

  return Support;
};
