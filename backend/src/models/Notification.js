module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recipient_id',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('data');
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
      set(value) {
        if (value && typeof value === 'object') {
          this.setDataValue('data', JSON.stringify(value));
        } else {
          this.setDataValue('data', value);
        }
      },
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.CareRecipient, {
      foreignKey: 'recipientId',
      as: 'recipient',
    });
  };

  return Notification;
};
