module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    careGiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'care_giver_id',
    },
    careRecipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'care_recipient_id',
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_at',
    },
  }, {
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
  });

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.CareGiver, {
      foreignKey: 'careGiverId',
      as: 'careGiver',
    });
    Conversation.belongsTo(models.CareRecipient, {
      foreignKey: 'careRecipientId',
      as: 'careRecipient',
    });
    Conversation.hasMany(models.Message, {
      foreignKey: 'conversationId',
      as: 'messages',
    });
  };

  return Conversation;
};
