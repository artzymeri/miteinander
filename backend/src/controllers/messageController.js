const { Op } = require('sequelize');
const models = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get or create a conversation between current user and the other party.
 * Works for both care_giver and care_recipient roles.
 * 
 * POST /api/messages/conversations
 * Body: { otherUserId: number }
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id;
    const role = req.userRole;

    if (!otherUserId) {
      return errorResponse(res, 'otherUserId is required', 400);
    }

    let careGiverId, careRecipientId;

    if (role === 'care_giver') {
      careGiverId = userId;
      careRecipientId = otherUserId;
      // Verify the recipient exists
      const recipient = await models.CareRecipient.findByPk(otherUserId);
      if (!recipient) return errorResponse(res, 'User not found', 404);
    } else if (role === 'care_recipient') {
      careRecipientId = userId;
      careGiverId = otherUserId;
      // Verify the caregiver exists
      const caregiver = await models.CareGiver.findByPk(otherUserId);
      if (!caregiver) return errorResponse(res, 'User not found', 404);
    } else {
      return errorResponse(res, 'Invalid role for messaging', 403);
    }

    // Find or create
    let [conversation, created] = await models.Conversation.findOrCreate({
      where: { careGiverId, careRecipientId },
      defaults: { careGiverId, careRecipientId },
    });

    // Reload with associations
    conversation = await models.Conversation.findByPk(conversation.id, {
      include: [
        {
          model: models.CareGiver,
          as: 'careGiver',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl', 'occupation'],
        },
        {
          model: models.CareRecipient,
          as: 'careRecipient',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
      ],
    });

    return successResponse(res, { conversation, created }, created ? 'Conversation created' : 'Conversation found');
  } catch (error) {
    console.error('getOrCreateConversation error:', error);
    return errorResponse(res, 'Failed to get/create conversation', 500);
  }
};

/**
 * Get all conversations for the current user.
 * Includes last message and unread count.
 * 
 * GET /api/messages/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.userRole;

    const whereClause = role === 'care_giver'
      ? { careGiverId: userId }
      : { careRecipientId: userId };

    const conversations = await models.Conversation.findAll({
      where: whereClause,
      include: [
        {
          model: models.CareGiver,
          as: 'careGiver',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl', 'occupation'],
        },
        {
          model: models.CareRecipient,
          as: 'careRecipient',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
        {
          model: models.Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'senderRole', 'senderId', 'isRead', 'createdAt'],
        },
      ],
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
    });

    // Calculate unread counts for each conversation
    const oppositeRole = role === 'care_giver' ? 'care_recipient' : 'care_giver';
    const conversationsData = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await models.Message.count({
          where: {
            conversationId: conv.id,
            senderRole: oppositeRole,
            isRead: false,
          },
        });

        const plainConv = conv.toJSON();
        return {
          ...plainConv,
          lastMessage: plainConv.messages?.[0] || null,
          unreadCount,
          messages: undefined, // Remove the full messages array
        };
      })
    );

    return successResponse(res, { conversations: conversationsData });
  } catch (error) {
    console.error('getConversations error:', error);
    return errorResponse(res, 'Failed to get conversations', 500);
  }
};

/**
 * Get messages for a conversation with pagination.
 * Marks messages from the other party as read.
 * 
 * GET /api/messages/conversations/:conversationId/messages?page=1&limit=50
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const role = req.userRole;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Verify user belongs to this conversation
    const conversation = await models.Conversation.findByPk(conversationId);
    if (!conversation) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const isParticipant = (role === 'care_giver' && conversation.careGiverId === userId) ||
      (role === 'care_recipient' && conversation.careRecipientId === userId);

    if (!isParticipant) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get messages (newest first for pagination, client reverses)
    const { count, rows: messages } = await models.Message.findAndCountAll({
      where: { conversationId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Mark other party's messages as read
    const oppositeRole = role === 'care_giver' ? 'care_recipient' : 'care_giver';
    await models.Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderRole: oppositeRole,
          isRead: false,
        },
      }
    );

    return successResponse(res, {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + messages.length < count,
      },
    });
  } catch (error) {
    console.error('getMessages error:', error);
    return errorResponse(res, 'Failed to get messages', 500);
  }
};

/**
 * Send a message (REST fallback — main path is through Socket.IO).
 * 
 * POST /api/messages/conversations/:conversationId/messages
 * Body: { content: string }
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const role = req.userRole;

    if (!content || !content.trim()) {
      return errorResponse(res, 'Message content is required', 400);
    }

    // Verify user belongs to this conversation
    const conversation = await models.Conversation.findByPk(conversationId);
    if (!conversation) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const isParticipant = (role === 'care_giver' && conversation.careGiverId === userId) ||
      (role === 'care_recipient' && conversation.careRecipientId === userId);

    if (!isParticipant) {
      return errorResponse(res, 'Access denied', 403);
    }

    const message = await models.Message.create({
      conversationId: parseInt(conversationId),
      senderRole: role,
      senderId: userId,
      content: content.trim(),
    });

    // Update conversation's last message timestamp
    await conversation.update({ lastMessageAt: new Date() });

    return successResponse(res, { message }, 'Message sent', 201);
  } catch (error) {
    console.error('sendMessage error:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

/**
 * Get total unread message count for the current user.
 * Used for sidebar badge.
 * 
 * GET /api/messages/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.userRole;

    // Find all conversation IDs for this user
    const whereClause = role === 'care_giver'
      ? { careGiverId: userId }
      : { careRecipientId: userId };

    const conversations = await models.Conversation.findAll({
      where: whereClause,
      attributes: ['id'],
    });

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return successResponse(res, { unreadCount: 0 });
    }

    const oppositeRole = role === 'care_giver' ? 'care_recipient' : 'care_giver';
    const unreadCount = await models.Message.count({
      where: {
        conversationId: { [Op.in]: conversationIds },
        senderRole: oppositeRole,
        isRead: false,
      },
    });

    return successResponse(res, { unreadCount });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return errorResponse(res, 'Failed to get unread count', 500);
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
};
