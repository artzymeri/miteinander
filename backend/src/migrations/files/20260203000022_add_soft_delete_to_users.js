'use strict';

/**
 * Migration: add_soft_delete_to_users
 * Adds deleted_at column to supports, care_givers, and care_recipients tables
 * to enable soft-delete (paranoid mode in Sequelize).
 * Records are never truly deleted — they are marked with a deleted_at timestamp.
 * Created: 2026-02-11
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('supports', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('care_givers', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('care_recipients', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('supports', 'deleted_at');
    await queryInterface.removeColumn('care_givers', 'deleted_at');
    await queryInterface.removeColumn('care_recipients', 'deleted_at');
  },
};
