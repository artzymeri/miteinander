'use strict';

/**
 * Migration: add_country_to_care_givers
 * Created: 2026-02-03
 * Description: Adds the country column to the care_givers table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists first
    const tableDescription = await queryInterface.describeTable('care_givers');
    
    if (!tableDescription.country) {
      await queryInterface.addColumn('care_givers', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'postal_code',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('care_givers');
    
    if (tableDescription.country) {
      await queryInterface.removeColumn('care_givers', 'country');
    }
  },
};
