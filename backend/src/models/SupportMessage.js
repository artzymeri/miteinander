module.exports = (sequelize, DataTypes) => {
  const SupportMessage = sequelize.define('SupportMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ticket_id',
    },
    senderRole: {
      type: DataTypes.ENUM('care_giver', 'care_recipient', 'admin', 'support'),
      allowNull: false,
      field: 'sender_role',
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sender_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
  }, {
    tableName: 'support_messages',
    timestamps: true,
    underscored: true,
  });

  SupportMessage.associate = (models) => {
    SupportMessage.belongsTo(models.SupportTicket, {
      foreignKey: 'ticketId',
      as: 'ticket',
    });
  };

  return SupportMessage;
};
