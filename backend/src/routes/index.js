const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const caregiverRoutes = require('./caregiverRoutes');
const recipientRoutes = require('./recipientRoutes');
const messageRoutes = require('./messageRoutes');
const supportRoutes = require('./supportRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const { authenticate } = require('../middlewares/auth');
const { sendFeedbackEmail } = require('../utils/email');
const { successResponse, errorResponse } = require('../utils/helpers');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/caregiver', caregiverRoutes);
router.use('/recipient', recipientRoutes);
router.use('/messages', messageRoutes);
router.use('/support', supportRoutes);
router.use('/subscription', subscriptionRoutes);

// Feedback endpoint
router.post('/feedback', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return errorResponse(res, 'Message is required', 400, 'EMPTY_MESSAGE');
    }
    const user = req.user;
    const result = await sendFeedbackEmail(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: req.userRole },
      message.trim()
    );
    if (result.success) {
      return successResponse(res, null, 'Feedback sent successfully');
    }
    return errorResponse(res, 'Failed to send feedback', 500, 'EMAIL_ERROR');
  } catch (error) {
    console.error('Feedback error:', error);
    return errorResponse(res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

module.exports = router;
