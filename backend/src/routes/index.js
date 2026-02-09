const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const caregiverRoutes = require('./caregiverRoutes');
const recipientRoutes = require('./recipientRoutes');
const messageRoutes = require('./messageRoutes');
const supportRoutes = require('./supportRoutes');

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

module.exports = router;
