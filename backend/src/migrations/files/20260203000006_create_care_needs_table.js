'use strict';

/**
 * Migration: create_care_needs_table
 * Created: 2026-02-03
 * Description: Dynamic care needs configuration table with multilingual support
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('care_needs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier key in camelCase',
      },
      label_en: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'English label in Pascal Case',
      },
      label_de: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'German label in Pascal Case',
      },
      label_fr: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'French label in Pascal Case',
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional English description',
      },
      description_de: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional German description',
      },
      description_fr: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional French description',
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Optional icon name from Lucide icons',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order in lists',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Admin ID who created this',
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Admin ID who last updated this',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index on key for faster lookups
    await queryInterface.addIndex('care_needs', ['key']);
    await queryInterface.addIndex('care_needs', ['is_active']);
    await queryInterface.addIndex('care_needs', ['sort_order']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_needs');
  },
};
