const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
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

// Settle with a caregiver
// POST /api/recipient/settle
router.post(
  '/settle',
  authenticate,
  careRecipientOnly,
  recipientController.settleWithCaregiver
);

// Unsettle from caregiver
// POST /api/recipient/unsettle
router.post(
  '/unsettle',
  authenticate,
  careRecipientOnly,
  recipientController.unsettleFromCaregiver
);

module.exports = router;
