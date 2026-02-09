'use strict';

/**
 * Migration: create_support_tickets_table
 * 
 * Support tickets for live chat between care_givers/care_recipients
 * and support agents/admins.
 * 
 * Flow:
 * - User opens support chat → creates a ticket (status=open, assigned_to=null)
 * - All support agents + admins see the ticket
 * - When a support agent replies → ticket is assigned to them, status=assigned
 * - Other support agents can no longer see it (admins still can)
 * - Admins can see ALL tickets regardless
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('support_tickets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_role: {
        type: Sequelize.ENUM('care_giver', 'care_recipient'),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('open', 'assigned', 'closed'),
        defaultValue: 'open',
      },
      assigned_to_role: {
        type: Sequelize.ENUM('admin', 'support'),
        allowNull: true,
      },
      assigned_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    await queryInterface.addIndex('support_tickets', ['user_role', 'user_id'], {
      name: 'idx_support_tickets_user',
    });

    await queryInterface.addIndex('support_tickets', ['status', 'assigned_to_id'], {
      name: 'idx_support_tickets_assignment',
    });

    await queryInterface.createTable('support_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'support_tickets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sender_role: {
        type: Sequelize.ENUM('care_giver', 'care_recipient', 'admin', 'support'),
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

    await queryInterface.addIndex('support_messages', ['ticket_id', 'created_at'], {
      name: 'idx_support_messages_ticket_date',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('support_messages');
    await queryInterface.dropTable('support_tickets');
  },
};
