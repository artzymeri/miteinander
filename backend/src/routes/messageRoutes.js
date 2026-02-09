const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

/**
 * Message routes
 * All routes require authentication (both care_giver and care_recipient)
 * 
 * These routes handle REST-based messaging.
 * Real-time delivery is handled via Socket.IO.
 */

// Get all conversations for the current user
// GET /api/messages/conversations
router.get(
  '/conversations',
  authenticate,
  messageController.getConversations
);

// Get or create a conversation
// POST /api/messages/conversations
router.post(
  '/conversations',
  authenticate,
  messageController.getOrCreateConversation
);

// Get messages for a conversation
// GET /api/messages/conversations/:conversationId/messages?page=1&limit=50
router.get(
  '/conversations/:conversationId/messages',
  authenticate,
  messageController.getMessages
);

// Send a message (REST fallback)
// POST /api/messages/conversations/:conversationId/messages
router.post(
  '/conversations/:conversationId/messages',
  authenticate,
  messageController.sendMessage
);

// Get total unread count (for sidebar badge)
// GET /api/messages/unread-count
router.get(
  '/unread-count',
  authenticate,
  messageController.getUnreadCount
);

module.exports = router;
