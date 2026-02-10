const models = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

const { Notification } = models;

/**
 * Get notifications for the current care recipient
 * GET /api/recipient/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const recipientId = req.user.id;

    const notifications = await Notification.findAll({
      where: { recipientId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: { recipientId, isRead: false },
    });

    return successResponse(res, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/recipient/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const recipientId = req.user.id;

    const unreadCount = await Notification.count({
      where: { recipientId, isRead: false },
    });

    return successResponse(res, { unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notifications as read
 * PUT /api/recipient/notifications/mark-read
 * Body: { notificationIds: number[] } — if empty/absent, marks ALL as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { notificationIds } = req.body;

    const whereClause = { recipientId, isRead: false };
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      whereClause.id = notificationIds;
    }

    await Notification.update({ isRead: true }, { where: whereClause });

    return successResponse(res, null, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a "rate your caregiver" notification.
 * Called internally (e.g. by a cron or after settlement + 1 day).
 */
const createRatingNotification = async (recipientId, caregiverId, caregiverName) => {
  try {
    // Check if notification already exists
    const existing = await Notification.findOne({
      where: {
        recipientId,
        type: 'rate_caregiver',
      },
    });
    if (existing) return existing;

    return await Notification.create({
      recipientId,
      type: 'rate_caregiver',
      title: 'Rate your caregiver',
      message: `You can now rate ${caregiverName}. Share your experience!`,
      data: { caregiverId },
    });
  } catch (error) {
    console.error('Failed to create rating notification:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  createRatingNotification,
};
