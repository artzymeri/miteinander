'use strict';

const bcrypt = require('bcryptjs');

/**
 * Migration: seed_mock_users
 * Created: 2026-02-03
 * 
 * Seeds one mock user per table (admin, support, care_recipient, care_giver)
 * Only inserts if the respective table is empty.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('123123123', 10);
    const now = new Date();

    // Check and seed admins table
    const [admins] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM admins');
    if (admins[0].count === 0) {
      await queryInterface.bulkInsert('admins', [{
        email: 'admin@test.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        phone: '+49 30 12345678',
        is_active: true,
        is_super_admin: true,
        created_at: now,
        updated_at: now,
      }]);
      console.log('✓ Seeded mock admin user: admin@test.com');
    }

    // Check and seed supports table
    const [supports] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM supports');
    if (supports[0].count === 0) {
      await queryInterface.bulkInsert('supports', [{
        email: 'support@test.com',
        password: hashedPassword,
        first_name: 'Support',
        last_name: 'User',
        phone: '+49 30 12345679',
        department: 'Customer Support',
        is_active: true,
        created_at: now,
        updated_at: now,
      }]);
      console.log('✓ Seeded mock support user: support@test.com');
    }

    // Check and seed care_recipients table
    const [careRecipients] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM care_recipients');
    if (careRecipients[0].count === 0) {
      await queryInterface.bulkInsert('care_recipients', [{
        email: 'recipient@test.com',
        password: hashedPassword,
        first_name: 'Care',
        last_name: 'Recipient',
        phone: '+49 30 12345680',
        date_of_birth: '1945-05-15',
        address: 'Musterstraße 123',
        city: 'Berlin',
        postal_code: '10115',
        care_needs: JSON.stringify(['daily assistance', 'medication reminders', 'companionship']),
        emergency_contact_name: 'Family Member',
        emergency_contact_phone: '+49 30 98765432',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      }]);
      console.log('✓ Seeded mock care recipient: recipient@test.com');
    }

    // Check and seed care_givers table
    const [careGivers] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM care_givers');
    if (careGivers[0].count === 0) {
      await queryInterface.bulkInsert('care_givers', [{
        email: 'caregiver@test.com',
        password: hashedPassword,
        first_name: 'Care',
        last_name: 'Giver',
        phone: '+49 30 12345681',
        date_of_birth: '1985-08-20',
        address: 'Pflegestraße 456',
        city: 'Berlin',
        postal_code: '10117',
        bio: 'Experienced caregiver with a passion for helping others. Over 10 years of experience in elderly care.',
        skills: JSON.stringify(['elderly care', 'medication management', 'mobility assistance', 'meal preparation']),
        certifications: JSON.stringify(['First Aid', 'CPR', 'Certified Nursing Assistant']),
        experience_years: 10,
        hourly_rate: 25.00,
        availability: JSON.stringify({
          monday: { available: true, start: '08:00', end: '18:00' },
          tuesday: { available: true, start: '08:00', end: '18:00' },
          wednesday: { available: true, start: '08:00', end: '18:00' },
          thursday: { available: true, start: '08:00', end: '18:00' },
          friday: { available: true, start: '08:00', end: '16:00' },
          saturday: { available: false },
          sunday: { available: false },
        }),
        is_active: true,
        is_verified: true,
        is_background_checked: true,
        created_at: now,
        updated_at: now,
      }]);
      console.log('✓ Seeded mock caregiver: caregiver@test.com');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove seeded mock users
    await queryInterface.bulkDelete('admins', { email: 'admin@test.com' });
    await queryInterface.bulkDelete('supports', { email: 'support@test.com' });
    await queryInterface.bulkDelete('care_recipients', { email: 'recipient@test.com' });
    await queryInterface.bulkDelete('care_givers', { email: 'caregiver@test.com' });
    
    console.log('✓ Removed all seeded mock users');
  },
};
