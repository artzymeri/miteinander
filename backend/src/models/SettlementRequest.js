module.exports = (sequelize, DataTypes) => {
  const SettlementRequest = sequelize.define('SettlementRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    careRecipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'care_recipient_id',
    },
    careGiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'care_giver_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at',
    },
  }, {
    tableName: 'settlement_requests',
    timestamps: true,
    underscored: true,
  });

  SettlementRequest.associate = (models) => {
    SettlementRequest.belongsTo(models.CareRecipient, {
      foreignKey: 'careRecipientId',
      as: 'careRecipient',
    });
    SettlementRequest.belongsTo(models.CareGiver, {
      foreignKey: 'careGiverId',
      as: 'careGiver',
    });
  };

  return SettlementRequest;
};
