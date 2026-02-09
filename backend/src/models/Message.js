module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'conversation_id',
    },
    senderRole: {
      type: DataTypes.ENUM('care_giver', 'care_recipient'),
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
    messageType: {
      type: DataTypes.ENUM('text', 'settlement_request', 'settlement_confirmed', 'settlement_dismissed'),
      defaultValue: 'text',
      allowNull: false,
      field: 'message_type',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation',
    });
  };

  return Message;
};
