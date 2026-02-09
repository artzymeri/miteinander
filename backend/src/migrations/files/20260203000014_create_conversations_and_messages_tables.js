'use strict';

/**
 * Migration: create_conversations_and_messages_tables
 * Created: 2026-02-07
 * 
 * Creates the conversations and messages tables for real-time chat
 * between care_givers and care_recipients.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create conversations table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      last_message_at: {
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

    // Unique constraint: one conversation per pair
    await queryInterface.addIndex('conversations', ['care_giver_id', 'care_recipient_id'], {
      unique: true,
      name: 'unique_conversation_pair',
    });

    // Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sender_role: {
        type: Sequelize.ENUM('care_giver', 'care_recipient'),
        allowNull: false,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Index for fast message lookup by conversation
    await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
      name: 'idx_messages_conversation_date',
    });

    // Index for unread count queries
    await queryInterface.addIndex('messages', ['conversation_id', 'is_read', 'sender_role'], {
      name: 'idx_messages_unread',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversations');
  },
};
