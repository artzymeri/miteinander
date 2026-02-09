'use strict';

/**
 * Migration: create_care_givers_table
 * Created: 2026-02-03
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('care_givers', {
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
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      skills: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of skills',
      },
      certifications: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of certifications',
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hourly_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      availability: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON object of availability schedule',
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
      is_background_checked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0,
      },
      review_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.addIndex('care_givers', ['email']);
    await queryInterface.addIndex('care_givers', ['city']);
    await queryInterface.addIndex('care_givers', ['is_active']);
    await queryInterface.addIndex('care_givers', ['is_verified']);
    await queryInterface.addIndex('care_givers', ['rating']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_givers');
  },
};
