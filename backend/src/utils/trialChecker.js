const { Op } = require('sequelize');
const { sendTrialExpiringEmail } = require('./email');

/**
 * Check for trial accounts expiring soon and send reminder emails.
 * 
 * - 2-day reminder: trialReminderSent === 0 AND trialEndsAt is within 2 days
 * - 1-day reminder: trialReminderSent <= 1 AND trialEndsAt is within 1 day
 * 
 * Called by a setInterval in server.js
 */
const checkTrialExpirations = async () => {
  try {
    // Lazy-require models to avoid circular dependency at startup
    const models = require('../models');
    const { CareGiver } = models;

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // --- 2-day reminders ---
    const twoDayUsers = await CareGiver.findAll({
      where: {
        subscriptionStatus: 'trial',
        trialEndsAt: {
          [Op.lte]: twoDaysFromNow,
          [Op.gt]: oneDayFromNow,
        },
        trialReminderSent: 0,
      },
    });

    for (const user of twoDayUsers) {
      await sendTrialExpiringEmail(user.email, user.firstName, 2);
      await user.update({ trialReminderSent: 1 });
      console.log(`📧 Sent 2-day trial reminder to ${user.email}`);
    }

    // --- 1-day reminders ---
    const oneDayUsers = await CareGiver.findAll({
      where: {
        subscriptionStatus: 'trial',
        trialEndsAt: {
          [Op.lte]: oneDayFromNow,
          [Op.gt]: now,
        },
        trialReminderSent: { [Op.lt]: 2 },
      },
    });

    for (const user of oneDayUsers) {
      await sendTrialExpiringEmail(user.email, user.firstName, 1);
      await user.update({ trialReminderSent: 2 });
      console.log(`📧 Sent 1-day trial reminder to ${user.email}`);
    }

    if (twoDayUsers.length > 0 || oneDayUsers.length > 0) {
      console.log(`✅ Trial check complete: ${twoDayUsers.length} 2-day, ${oneDayUsers.length} 1-day reminders sent`);
    }
  } catch (error) {
    console.error('❌ Trial expiration check failed:', error.message);
  }
};

module.exports = { checkTrialExpirations };
