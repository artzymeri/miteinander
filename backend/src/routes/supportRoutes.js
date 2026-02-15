const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { adminOrSupport } = require('../middlewares/roleGuard');

// User-facing: get or create their support ticket
router.post('/ticket', authenticate, supportController.getOrCreateTicket);

// Get messages for a ticket (accessible by user, assigned support, or admin)
router.get('/tickets/:ticketId/messages', authenticate, supportController.getTicketMessages);

// Send a message in a ticket
router.post('/tickets/:ticketId/messages', authenticate, supportController.sendTicketMessage);

// Admin/Support: get all tickets
router.get('/tickets', authenticate, adminOrSupport, supportController.getTickets);

// Admin/Support: close a ticket
router.put('/tickets/:ticketId/close', authenticate, adminOrSupport, supportController.closeTicket);

// Admin: assign a ticket to a support staff member
router.put('/tickets/:ticketId/assign', authenticate, adminOrSupport, supportController.assignTicket);

// Admin: get active support staff for assignment dropdown
router.get('/staff', authenticate, adminOrSupport, supportController.getActiveStaff);

// Subscription details for a user
router.get('/subscription/:userType/:userId', authenticate, adminOrSupport, adminController.getUserSubscriptionDetails);

// Support-accessible read-only routes (reuse admin controller)
router.get('/care-givers', authenticate, adminOrSupport, adminController.getAllCareGivers);
router.get('/care-givers/:id', authenticate, adminOrSupport, adminController.getCareGiverById);
router.get('/care-givers/:id/reviews', authenticate, adminOrSupport, adminController.getCaregiverReviews);
router.get('/care-recipients', authenticate, adminOrSupport, adminController.getAllCareRecipients);
router.get('/care-recipients/:id', authenticate, adminOrSupport, adminController.getCareRecipientById);

module.exports = router;
