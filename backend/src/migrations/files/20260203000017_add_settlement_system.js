'use strict';

/**
 * Migration: add_settlement_system
 * Created: 2026-02-09
 * 
 * Adds settlement fields to care_recipients and a message_type to messages.
 * - care_recipients: is_settled, settled_with_caregiver_id
 * - messages: message_type ENUM ('text', 'settlement_request', 'settlement_confirmed', 'settlement_dismissed')
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add settlement fields to care_recipients
    await queryInterface.addColumn('care_recipients', 'is_settled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('care_recipients', 'settled_with_caregiver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'care_givers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('care_recipients', 'settled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add message_type to messages table
    await queryInterface.addColumn('messages', 'message_type', {
      type: Sequelize.ENUM('text', 'settlement_request', 'settlement_confirmed', 'settlement_dismissed'),
      defaultValue: 'text',
      allowNull: false,
    });

    // Add index on is_settled for filtering
    await queryInterface.addIndex('care_recipients', ['is_settled'], {
      name: 'idx_care_recipients_is_settled',
    });

    // Add index on settled_with_caregiver_id for "my clients" lookup
    await queryInterface.addIndex('care_recipients', ['settled_with_caregiver_id'], {
      name: 'idx_care_recipients_settled_caregiver',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('care_recipients', 'idx_care_recipients_settled_caregiver');
    await queryInterface.removeIndex('care_recipients', 'idx_care_recipients_is_settled');
    
    await queryInterface.removeColumn('messages', 'message_type');
    // Clean up the ENUM type
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS \"enum_messages_message_type\";"
    ).catch(() => {}); // Ignore if MySQL

    await queryInterface.removeColumn('care_recipients', 'settled_at');
    await queryInterface.removeColumn('care_recipients', 'settled_with_caregiver_id');
    await queryInterface.removeColumn('care_recipients', 'is_settled');
  },
};
