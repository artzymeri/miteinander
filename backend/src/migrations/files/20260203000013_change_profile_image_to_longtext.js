'use strict';

/**
 * Migration: change_profile_image_to_longtext
 * Created: 2026-02-03
 * Description: Changes profile_image_url column from VARCHAR(500) to LONGTEXT to support base64 images
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change profile_image_url column to LONGTEXT in care_recipients table
    await queryInterface.changeColumn('care_recipients', 'profile_image_url', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    
    // Change profile_image_url column to LONGTEXT in care_givers table
    await queryInterface.changeColumn('care_givers', 'profile_image_url', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to STRING(500)
    await queryInterface.changeColumn('care_recipients', 'profile_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    
    await queryInterface.changeColumn('care_givers', 'profile_image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },
};
