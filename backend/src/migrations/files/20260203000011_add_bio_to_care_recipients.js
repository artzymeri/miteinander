/**
 * Migration: Add bio column to care_recipients table
 */

module.exports = {
  name: '20260203000011_add_bio_to_care_recipients',

  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('care_recipients', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'care_needs',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('care_recipients', 'bio');
  },
};
