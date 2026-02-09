/**
 * Migration: Add country column to care_recipients table
 */

module.exports = {
  name: '20260203000009_add_country_to_care_recipients',

  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('care_recipients', 'country', {
      type: Sequelize.STRING(2),
      allowNull: true,
      defaultValue: 'DE',
      after: 'postal_code',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('care_recipients', 'country');
  },
};
