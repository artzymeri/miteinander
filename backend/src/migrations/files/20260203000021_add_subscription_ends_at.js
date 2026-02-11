'use strict';

/**
 * Migration: add_subscription_ends_at
 * Adds subscription_ends_at column to track when a canceled subscription
 * actually expires (user can still use the service until then).
 * Created: 2026-02-03
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('care_givers', 'subscription_ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'subscription_ends_at',
    });

    await queryInterface.addColumn('care_recipients', 'subscription_ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
      field: 'subscription_ends_at',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('care_givers', 'subscription_ends_at');
    await queryInterface.removeColumn('care_recipients', 'subscription_ends_at');
  },
};
