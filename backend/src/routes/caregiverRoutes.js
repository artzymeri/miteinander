const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');
const { authenticate } = require('../middlewares/auth');
const { careGiverOnly } = require('../middlewares/roleGuard');

/**
 * Caregiver routes
 * All routes require authentication and care_giver role
 * 
 * SECURITY: 
 * - All routes protected by JWT authentication
 * - Role-based access control ensures only care_givers can access
 */

// Find clients (care recipients) with infinite scroll pagination
// GET /api/caregiver/clients?page=1&limit=25&search=&country=&city=&careNeeds[]=
router.get(
  '/clients',
  authenticate,
  careGiverOnly,
  caregiverController.findClients
);

// Get filter options for search
// GET /api/caregiver/clients/filters?country=
router.get(
  '/clients/filters',
  authenticate,
  careGiverOnly,
  caregiverController.getFilterOptions
);

// Get a specific client's profile
// GET /api/caregiver/clients/:id
router.get(
  '/clients/:id',
  authenticate,
  careGiverOnly,
  caregiverController.getClientProfile
);

// Get settled clients ("My Clients")
// GET /api/caregiver/my-clients
router.get(
  '/my-clients',
  authenticate,
  careGiverOnly,
  caregiverController.getMySettledClients
);

// Get a settled client's full profile
// GET /api/caregiver/my-clients/:id
router.get(
  '/my-clients/:id',
  authenticate,
  careGiverOnly,
  caregiverController.getSettledClientProfile
);

// Get own profile (caregiver)
// GET /api/caregiver/profile
router.get(
  '/profile',
  authenticate,
  careGiverOnly,
  caregiverController.getMyProfile
);

// Update own profile (caregiver)
// PUT /api/caregiver/profile
router.put(
  '/profile',
  authenticate,
  careGiverOnly,
  caregiverController.updateMyProfile
);

// Update password
// PUT /api/caregiver/profile/password
router.put(
  '/profile/password',
  authenticate,
  careGiverOnly,
  caregiverController.updatePassword
);

// Update email
// PUT /api/caregiver/profile/email
router.put(
  '/profile/email',
  authenticate,
  careGiverOnly,
  caregiverController.updateEmail
);

// Get own reviews
// GET /api/caregiver/reviews
router.get(
  '/reviews',
  authenticate,
  careGiverOnly,
  caregiverController.getMyReviews
);

// ── Settlement Requests ──

// Get pending settlement requests
// GET /api/caregiver/settlement-requests
router.get(
  '/settlement-requests',
  authenticate,
  careGiverOnly,
  caregiverController.getSettlementRequests
);

// Get count of pending settlement requests
// GET /api/caregiver/settlement-requests/count
router.get(
  '/settlement-requests/count',
  authenticate,
  careGiverOnly,
  caregiverController.getSettlementRequestCount
);

// Confirm a settlement request
// POST /api/caregiver/settlement-requests/:id/confirm
router.post(
  '/settlement-requests/:id/confirm',
  authenticate,
  careGiverOnly,
  caregiverController.confirmSettlementRequest
);

// Reject a settlement request
// POST /api/caregiver/settlement-requests/:id/reject
router.post(
  '/settlement-requests/:id/reject',
  authenticate,
  careGiverOnly,
  caregiverController.rejectSettlementRequest
);

module.exports = router;
