const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const notificationController = require('../controllers/notificationController');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth');
const { careRecipientOnly } = require('../middlewares/roleGuard');

/**
 * Care Recipient routes
 * All routes require authentication and care_recipient role
 * 
 * SECURITY: 
 * - All routes protected by JWT authentication
 * - Role-based access control ensures only care_recipients can access
 */

// Find caregivers with infinite scroll pagination
// GET /api/recipient/caregivers?page=1&limit=25&search=&country=&city=&skills[]=
router.get(
  '/caregivers',
  authenticate,
  careRecipientOnly,
  recipientController.findCaregivers
);

// Get filter options for search
// GET /api/recipient/caregivers/filters?country=
router.get(
  '/caregivers/filters',
  authenticate,
  careRecipientOnly,
  recipientController.getFilterOptions
);

// Get a specific caregiver's profile
// GET /api/recipient/caregivers/:id
router.get(
  '/caregivers/:id',
  authenticate,
  careRecipientOnly,
  recipientController.getCaregiverProfile
);

// Get own profile (recipient)
// GET /api/recipient/profile
router.get(
  '/profile',
  authenticate,
  careRecipientOnly,
  recipientController.getMyProfile
);

// Update own profile (recipient)
// PUT /api/recipient/profile
router.put(
  '/profile',
  authenticate,
  careRecipientOnly,
  recipientController.updateMyProfile
);

// Update password
// PUT /api/recipient/profile/password
router.put(
  '/profile/password',
  authenticate,
  careRecipientOnly,
  recipientController.updatePassword
);

// Update email
// PUT /api/recipient/profile/email
router.put(
  '/profile/email',
  authenticate,
  careRecipientOnly,
  recipientController.updateEmail
);

// Settle with a caregiver (sends a pending request)
// POST /api/recipient/settle
router.post(
  '/settle',
  authenticate,
  careRecipientOnly,
  recipientController.settleWithCaregiver
);

// Cancel a pending settlement request
// POST /api/recipient/cancel-settlement
router.post(
  '/cancel-settlement',
  authenticate,
  careRecipientOnly,
  recipientController.cancelSettlementRequest
);

// Unsettle from caregiver
// POST /api/recipient/unsettle
router.post(
  '/unsettle',
  authenticate,
  careRecipientOnly,
  recipientController.unsettleFromCaregiver
);

// ── Notifications ──

// Get notifications
// GET /api/recipient/notifications
router.get(
  '/notifications',
  authenticate,
  careRecipientOnly,
  notificationController.getNotifications
);

// Get unread notification count
// GET /api/recipient/notifications/unread-count
router.get(
  '/notifications/unread-count',
  authenticate,
  careRecipientOnly,
  notificationController.getUnreadCount
);

// Mark notifications as read
// PUT /api/recipient/notifications/mark-read
router.put(
  '/notifications/mark-read',
  authenticate,
  careRecipientOnly,
  notificationController.markAsRead
);

// ── Reviews ──

// Submit a review
// POST /api/recipient/reviews
router.post(
  '/reviews',
  authenticate,
  careRecipientOnly,
  reviewController.submitReview
);

// Get reviews for a caregiver
// GET /api/recipient/reviews/:caregiverId
router.get(
  '/reviews/:caregiverId',
  authenticate,
  careRecipientOnly,
  reviewController.getCaregiverReviews
);

// Check if already reviewed
// GET /api/recipient/reviews/:caregiverId/check
router.get(
  '/reviews/:caregiverId/check',
  authenticate,
  careRecipientOnly,
  reviewController.checkReview
);

module.exports = router;
