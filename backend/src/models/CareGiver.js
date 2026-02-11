const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const CareGiver = sequelize.define('CareGiver', {
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
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of care need IDs (integers) - resolved dynamically from care_needs table',
      get() {
        const value = this.getDataValue('skills');
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('skills', JSON.stringify(value));
        } else if (typeof value === 'string') {
          this.setDataValue('skills', value);
        } else {
          this.setDataValue('skills', null);
        }
      },
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of certifications',
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'experience_years',
    },
    occupation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    availability: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON object of availability schedule',
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
    isBackgroundChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_background_checked',
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'review_count',
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
      defaultValue: 'trial',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  }, {
    tableName: 'care_givers',
    timestamps: true,
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (careGiver) => {
        if (careGiver.password) {
          careGiver.password = await bcrypt.hash(careGiver.password, 10);
        }
      },
      beforeUpdate: async (careGiver) => {
        if (careGiver.changed('password')) {
          careGiver.password = await bcrypt.hash(careGiver.password, 10);
        }
      },
    },
  });

  // Instance methods
  CareGiver.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  CareGiver.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.verificationCode;
    delete values.verificationCodeExpiresAt;
    delete values.resetPasswordCode;
    delete values.resetPasswordCodeExpiresAt;
    delete values.stripeCustomerId;
    delete values.deletedAt;
    return values;
  };

  // Associations
  CareGiver.associate = (models) => {
    // Add associations here when needed
    // Example: CareGiver.hasMany(models.Booking, { foreignKey: 'care_giver_id' });
  };

  return CareGiver;
};
