'use strict';

/**
 * Change reviews.rating from INTEGER to DECIMAL(2,1) to support 0.5 star increments
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('reviews', 'rating', {
      type: Sequelize.DECIMAL(2, 1),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('reviews', 'rating', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
