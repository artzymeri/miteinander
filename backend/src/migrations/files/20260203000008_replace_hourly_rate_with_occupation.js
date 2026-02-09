'use strict';

/**
 * Migration: Replace hourly_rate with occupation column in care_givers table
 * Created: 2026-02-03
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add occupation column
    await queryInterface.addColumn('care_givers', 'occupation', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Remove hourly_rate column
    await queryInterface.removeColumn('care_givers', 'hourly_rate');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add hourly_rate column
    await queryInterface.addColumn('care_givers', 'hourly_rate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    // Remove occupation column
    await queryInterface.removeColumn('care_givers', 'occupation');
  },
};
