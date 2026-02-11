'use strict';

/**
 * Add reset_password_code and reset_password_code_expires_at columns
 * to all user tables so the forgot-password flow can work.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = ['admins', 'supports', 'care_givers', 'care_recipients'];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'reset_password_code', {
        type: Sequelize.STRING(6),
        allowNull: true,
      });
      await queryInterface.addColumn(table, 'reset_password_code_expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const tables = ['admins', 'supports', 'care_givers', 'care_recipients'];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'reset_password_code');
      await queryInterface.removeColumn(table, 'reset_password_code_expires_at');
    }
  },
};
