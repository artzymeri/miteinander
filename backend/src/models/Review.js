module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
  });

  Review.associate = (models) => {
    Review.belongsTo(models.CareRecipient, {
      foreignKey: 'careRecipientId',
      as: 'careRecipient',
    });
    Review.belongsTo(models.CareGiver, {
      foreignKey: 'careGiverId',
      as: 'careGiver',
    });
  };

  return Review;
};
