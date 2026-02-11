'use strict';

/**
 * Migration: add_subscription_fields
 * Adds Stripe subscription and trial fields to care_givers and care_recipients tables.
 * Created: 2026-02-03
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // --- care_givers ---
    await queryInterface.addColumn('care_givers', 'stripe_customer_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('care_givers', 'subscription_status', {
      type: Sequelize.ENUM('trial', 'active', 'past_due', 'canceled', 'none'),
      defaultValue: 'trial',
    });
    await queryInterface.addColumn('care_givers', 'subscription_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('care_givers', 'trial_ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('care_givers', 'trial_reminder_sent', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '0=none, 1=2-day reminder sent, 2=1-day reminder sent',
    });

    // --- care_recipients ---
    await queryInterface.addColumn('care_recipients', 'stripe_customer_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('care_recipients', 'subscription_status', {
      type: Sequelize.ENUM('trial', 'active', 'past_due', 'canceled', 'none'),
      defaultValue: 'none',
    });
    await queryInterface.addColumn('care_recipients', 'subscription_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('care_recipients', 'trial_ends_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('care_recipients', 'trial_reminder_sent', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    // Set trial_ends_at for existing caregivers to 7 days from now
    await queryInterface.sequelize.query(
      `UPDATE care_givers SET trial_ends_at = DATE_ADD(NOW(), INTERVAL 7 DAY), subscription_status = 'trial' WHERE subscription_status = 'trial' OR subscription_status IS NULL`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('care_givers', 'stripe_customer_id');
    await queryInterface.removeColumn('care_givers', 'subscription_status');
    await queryInterface.removeColumn('care_givers', 'subscription_id');
    await queryInterface.removeColumn('care_givers', 'trial_ends_at');
    await queryInterface.removeColumn('care_givers', 'trial_reminder_sent');

    await queryInterface.removeColumn('care_recipients', 'stripe_customer_id');
    await queryInterface.removeColumn('care_recipients', 'subscription_status');
    await queryInterface.removeColumn('care_recipients', 'subscription_id');
    await queryInterface.removeColumn('care_recipients', 'trial_ends_at');
    await queryInterface.removeColumn('care_recipients', 'trial_reminder_sent');
  },
};
