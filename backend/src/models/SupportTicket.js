module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userRole: {
      type: DataTypes.ENUM('care_giver', 'care_recipient'),
      allowNull: false,
      field: 'user_role',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    status: {
      type: DataTypes.ENUM('open', 'assigned', 'closed'),
      defaultValue: 'open',
    },
    assignedToRole: {
      type: DataTypes.ENUM('admin', 'support'),
      allowNull: true,
      field: 'assigned_to_role',
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to_id',
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at',
    },
  }, {
    tableName: 'support_tickets',
    timestamps: true,
    underscored: true,
  });

  SupportTicket.associate = (models) => {
    SupportTicket.hasMany(models.SupportMessage, {
      foreignKey: 'ticketId',
      as: 'messages',
    });
  };

  return SupportTicket;
};
