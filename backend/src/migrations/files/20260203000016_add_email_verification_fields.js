'use strict';

/**
 * Migration: add_email_verification_fields
 * Created: 2026-02-09
 * 
 * Adds email verification fields to care_givers and care_recipients tables.
 * - email_verified: boolean (default false)
 * - verification_code: 6-digit code string
 * - verification_code_expires_at: datetime
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add to care_recipients
    await queryInterface.addColumn('care_recipients', 'email_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('care_recipients', 'verification_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });
    await queryInterface.addColumn('care_recipients', 'verification_code_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add to care_givers
    await queryInterface.addColumn('care_givers', 'email_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('care_givers', 'verification_code', {
      type: Sequelize.STRING(6),
      allowNull: true,
    });
    await queryInterface.addColumn('care_givers', 'verification_code_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Mark all existing users as verified (so existing accounts aren't locked out)
    await queryInterface.sequelize.query(
      "UPDATE care_recipients SET email_verified = true WHERE email_verified = false"
    );
    await queryInterface.sequelize.query(
      "UPDATE care_givers SET email_verified = true WHERE email_verified = false"
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('care_recipients', 'email_verified');
    await queryInterface.removeColumn('care_recipients', 'verification_code');
    await queryInterface.removeColumn('care_recipients', 'verification_code_expires_at');

    await queryInterface.removeColumn('care_givers', 'email_verified');
    await queryInterface.removeColumn('care_givers', 'verification_code');
    await queryInterface.removeColumn('care_givers', 'verification_code_expires_at');
  },
};
