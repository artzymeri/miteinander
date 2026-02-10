'use strict';

/**
 * Migration: create_notifications_and_reviews
 * Created: 2026-02-10
 * 
 * Creates:
 * - notifications table for care_recipients
 * - reviews table for care_recipients to rate care_givers
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'care_recipients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Notification type, e.g. rate_caregiver',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON metadata for the notification',
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

    await queryInterface.addIndex('notifications', ['recipient_id', 'is_read'], {
      name: 'idx_notifications_recipient_read',
    });

    // Create reviews table
    await queryInterface.createTable('reviews', {
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
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: Sequelize.TEXT,
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

    // Unique constraint: one review per recipient-caregiver pair
    await queryInterface.addIndex('reviews', ['care_recipient_id', 'care_giver_id'], {
      name: 'idx_reviews_unique_pair',
      unique: true,
    });

    await queryInterface.addIndex('reviews', ['care_giver_id'], {
      name: 'idx_reviews_caregiver',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('notifications');
  },
};
