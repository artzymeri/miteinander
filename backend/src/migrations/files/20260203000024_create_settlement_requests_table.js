'use strict';

/**
 * Migration: create_settlement_requests_table
 * 
 * Creates a settlement_requests table for the two-step settlement confirmation flow.
 * A care recipient sends a request → caregiver confirms or rejects.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settlement_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      care_recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'care_recipients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      care_giver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'care_givers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      responded_at: {
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

    // Index for caregiver to find their pending requests quickly
    await queryInterface.addIndex('settlement_requests', ['care_giver_id', 'status'], {
      name: 'idx_settlement_requests_caregiver_status',
    });

    // Index for recipient to check existing pending requests
    await queryInterface.addIndex('settlement_requests', ['care_recipient_id', 'status'], {
      name: 'idx_settlement_requests_recipient_status',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('settlement_requests');
  },
};
