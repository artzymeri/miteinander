const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  verifyCheckout,
} = require('../controllers/subscriptionController');

// All routes require authentication
router.use(authenticate);

// Get subscription status
router.get('/status', getSubscriptionStatus);

// Create checkout session
router.post('/create-checkout', createCheckoutSession);

// Create customer portal session
router.post('/portal', createPortalSession);

// Verify checkout session
router.post('/verify', verifyCheckout);

module.exports = router;
