const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const CareRecipient = sequelize.define('CareRecipient', {
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
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'postal_code',
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      defaultValue: 'DE',
    },
    careNeeds: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'care_needs',
      comment: 'JSON array of care need IDs (integers) - resolved dynamically from care_needs table',
      get() {
        const value = this.getDataValue('careNeeds');
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('careNeeds', JSON.stringify(value));
        } else if (typeof value === 'string') {
          this.setDataValue('careNeeds', value);
        } else {
          this.setDataValue('careNeeds', null);
        }
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User bio/about text',
    },
    emergencyContactName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'emergency_contact_name',
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone',
    },
    profileImageUrl: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'profile_image_url',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
    verificationCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
      field: 'verification_code',
    },
    verificationCodeExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_code_expires_at',
    },
    isSettled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_settled',
    },
    settledWithCaregiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'settled_with_caregiver_id',
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'settled_at',
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
    stripeCustomerId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'stripe_customer_id',
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'past_due', 'canceled', 'none'),
      defaultValue: 'none',
      field: 'subscription_status',
    },
    subscriptionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'subscription_id',
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'trial_ends_at',
    },
    subscriptionEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'subscription_ends_at',
    },
    trialReminderSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'trial_reminder_sent',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
  }, {
    tableName: 'care_recipients',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (careRecipient) => {
        if (careRecipient.password) {
          careRecipient.password = await bcrypt.hash(careRecipient.password, 10);
        }
      },
      beforeUpdate: async (careRecipient) => {
        if (careRecipient.changed('password')) {
          careRecipient.password = await bcrypt.hash(careRecipient.password, 10);
        }
      },
    },
  });

  // Instance methods
  CareRecipient.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  CareRecipient.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.verificationCode;
    delete values.verificationCodeExpiresAt;
    delete values.resetPasswordCode;
    delete values.resetPasswordCodeExpiresAt;
    delete values.stripeCustomerId;
    return values;
  };

  // Associations
  CareRecipient.associate = (models) => {
    CareRecipient.belongsTo(models.CareGiver, {
      foreignKey: 'settledWithCaregiverId',
      as: 'settledWithCaregiver',
    });
  };

  return CareRecipient;
};
