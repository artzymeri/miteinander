'use strict';

/**
 * Migration: create_care_recipients_table
 * Created: 2026-02-03
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('care_recipients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      care_needs: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of care needs',
      },
      emergency_contact_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      profile_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('care_recipients', ['email']);
    await queryInterface.addIndex('care_recipients', ['city']);
    await queryInterface.addIndex('care_recipients', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_recipients');
  },
};
