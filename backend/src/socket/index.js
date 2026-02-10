const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const { getModelByRole } = require('../utils/helpers');
const models = require('../models');

let io;

/**
 * Track online users: Map<string, Set<socketId>>
 * Key format: "role:userId" e.g. "care_giver:4"
 */
const onlineUsers = new Map();

const getUserKey = (role, userId) => `${role}:${userId}`;

const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:1003', 'http://127.0.0.1:1003'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const Model = getModelByRole(decoded.role, models);
      if (!Model) {
        return next(new Error('Invalid role'));
      }

      const user = await Model.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userKey = getUserKey(decoded.role, decoded.id);

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userKey} (${socket.id})`);

    // Track online user
    if (!onlineUsers.has(socket.userKey)) {
      onlineUsers.set(socket.userKey, new Set());
    }
    onlineUsers.get(socket.userKey).add(socket.id);

    // Join user's personal room for targeted notifications
    socket.join(socket.userKey);

    // Support/Admin agents join their respective rooms
    if (socket.userRole === 'support') {
      socket.join('support_agents');
      console.log(`  🎧 ${socket.userKey} joined support_agents room`);
    }
    if (socket.userRole === 'admin') {
      socket.join('admin_agents');
      console.log(`  👑 ${socket.userKey} joined admin_agents room`);
    }

    /**
     * Join a conversation room
     * Client emits: socket.emit('join_conversation', { conversationId })
     */
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        const conversation = await models.Conversation.findByPk(conversationId);
        if (!conversation) return;

        // Verify participation
        const isParticipant =
          (socket.userRole === 'care_giver' && conversation.careGiverId === socket.userId) ||
          (socket.userRole === 'care_recipient' && conversation.careRecipientId === socket.userId);

        if (!isParticipant) return;

        socket.join(`conversation:${conversationId}`);
        console.log(`  📨 ${socket.userKey} joined conversation:${conversationId}`);

        // Mark messages from the other party as read
        const oppositeRole = socket.userRole === 'care_giver' ? 'care_recipient' : 'care_giver';
        const updatedCount = await models.Message.update(
          { isRead: true },
          {
            where: {
              conversationId,
              senderRole: oppositeRole,
              isRead: false,
            },
          }
        );

        if (updatedCount[0] > 0) {
          // Notify the other party that their messages were read
          const otherUserKey = oppositeRole === 'care_giver'
            ? getUserKey('care_giver', conversation.careGiverId)
            : getUserKey('care_recipient', conversation.careRecipientId);

          io.to(otherUserKey).emit('messages_read', {
            conversationId: parseInt(conversationId),
          });
        }
      } catch (error) {
        console.error('join_conversation error:', error);
      }
    });

    /**
     * Leave a conversation room
     */
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    /**
     * Send a message via socket
     * Client emits: socket.emit('send_message', { conversationId, content, messageType })
     */
    socket.on('send_message', async ({ conversationId, content, messageType = 'text' }, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ error: 'Message content is required' });
        }

        const conversation = await models.Conversation.findByPk(conversationId);
        if (!conversation) {
          return callback?.({ error: 'Conversation not found' });
        }

        // Verify participation
        const isParticipant =
          (socket.userRole === 'care_giver' && conversation.careGiverId === socket.userId) ||
          (socket.userRole === 'care_recipient' && conversation.careRecipientId === socket.userId);

        if (!isParticipant) {
          return callback?.({ error: 'Access denied' });
        }

        // Only caregivers can send settlement requests
        if (messageType === 'settlement_request' && socket.userRole !== 'care_giver') {
          return callback?.({ error: 'Only caregivers can send settlement requests' });
        }

        // Prevent settlement request if recipient is already settled
        if (messageType === 'settlement_request') {
          const recipient = await models.CareRecipient.findByPk(conversation.careRecipientId);
          if (recipient && recipient.isSettled) {
            return callback?.({ error: 'Care recipient is already settled' });
          }
        }

        // Block messages from caregivers to settled recipients (unless settled with them)
        if (socket.userRole === 'care_giver') {
          const recipient = await models.CareRecipient.findByPk(conversation.careRecipientId);
          if (recipient && recipient.isSettled && recipient.settledWithCaregiverId !== socket.userId) {
            return callback?.({ error: 'This care recipient is settled with another caregiver' });
          }
        }

        // Create message
        const message = await models.Message.create({
          conversationId: parseInt(conversationId),
          senderRole: socket.userRole,
          senderId: socket.userId,
          content: content.trim(),
          messageType,
        });

        // Update conversation timestamp
        await conversation.update({ lastMessageAt: new Date() });

        const messageData = message.toJSON();

        // Broadcast to everyone in the conversation room (including sender)
        io.to(`conversation:${conversationId}`).emit('new_message', messageData);

        // Also notify the other party's personal room (for badge/notification if not in conversation)
        const otherUserKey = socket.userRole === 'care_giver'
          ? getUserKey('care_recipient', conversation.careRecipientId)
          : getUserKey('care_giver', conversation.careGiverId);

        // Send notification to other user's personal room
        io.to(otherUserKey).emit('new_message_notification', {
          conversationId: parseInt(conversationId),
          message: messageData,
          senderName: `${socket.userId}`, // Frontend will resolve the name
        });

        callback?.({ success: true, message: messageData });
      } catch (error) {
        console.error('send_message error:', error);
        callback?.({ error: 'Failed to send message' });
      }
    });

    /**
     * Typing indicators
     */
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userKey: socket.userKey,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        conversationId,
        userKey: socket.userKey,
      });
    });

    /**
     * Respond to a settlement request
     * Client emits: socket.emit('respond_settlement', { conversationId, messageId, accepted })
     */
    socket.on('respond_settlement', async ({ conversationId, messageId, accepted }, callback) => {
      try {
        if (socket.userRole !== 'care_recipient') {
          return callback?.({ error: 'Only care recipients can respond to settlement requests' });
        }

        const conversation = await models.Conversation.findByPk(conversationId);
        if (!conversation || conversation.careRecipientId !== socket.userId) {
          return callback?.({ error: 'Access denied' });
        }

        // Find the original settlement request message
        const requestMsg = await models.Message.findByPk(messageId);
        if (!requestMsg || requestMsg.messageType !== 'settlement_request') {
          return callback?.({ error: 'Invalid settlement request' });
        }

        const responseType = accepted ? 'settlement_confirmed' : 'settlement_dismissed';
        const responseContent = accepted
          ? 'Settlement confirmed'
          : 'Settlement declined';

        // Create response message
        const message = await models.Message.create({
          conversationId: parseInt(conversationId),
          senderRole: 'care_recipient',
          senderId: socket.userId,
          content: responseContent,
          messageType: responseType,
        });

        await conversation.update({ lastMessageAt: new Date() });

        if (accepted) {
          // Mark care recipient as settled
          const recipient = await models.CareRecipient.findByPk(socket.userId);
          if (recipient && !recipient.isSettled) {
            await recipient.update({
              isSettled: true,
              settledWithCaregiverId: conversation.careGiverId,
              settledAt: new Date(),
            });
          }
        }

        const messageData = message.toJSON();

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', messageData);

        // Notify caregiver
        const caregiverKey = getUserKey('care_giver', conversation.careGiverId);
        io.to(caregiverKey).emit('new_message_notification', {
          conversationId: parseInt(conversationId),
          message: messageData,
        });

        if (accepted) {
          // Notify both parties of settlement
          io.to(`conversation:${conversationId}`).emit('settlement_completed', {
            conversationId: parseInt(conversationId),
            careRecipientId: socket.userId,
            careGiverId: conversation.careGiverId,
          });
        }

        callback?.({ success: true, message: messageData });
      } catch (error) {
        console.error('respond_settlement error:', error);
        callback?.({ error: 'Failed to respond to settlement' });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        const oppositeRole = socket.userRole === 'care_giver' ? 'care_recipient' : 'care_giver';
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

        const conversation = await models.Conversation.findByPk(conversationId);
        if (conversation) {
          const otherUserKey = oppositeRole === 'care_giver'
            ? getUserKey('care_giver', conversation.careGiverId)
            : getUserKey('care_recipient', conversation.careRecipientId);

          io.to(otherUserKey).emit('messages_read', {
            conversationId: parseInt(conversationId),
          });
        }
      } catch (error) {
        console.error('mark_read error:', error);
      }
    });

    /**
     * Join a support ticket room
     * Client emits: socket.emit('join_support_ticket', { ticketId })
     */
    socket.on('join_support_ticket', async ({ ticketId }) => {
      try {
        const ticket = await models.SupportTicket.findByPk(ticketId);
        if (!ticket) return;

        // Verify access
        const isUser = (socket.userRole === ticket.userRole && socket.userId === ticket.userId);
        const isAdmin = socket.userRole === 'admin';
        const isAssignedSupport = socket.userRole === 'support' && ticket.assignedToId === socket.userId;
        const isUnassignedOpen = socket.userRole === 'support' && ticket.status === 'open';

        if (!isUser && !isAdmin && !isAssignedSupport && !isUnassignedOpen) return;

        socket.join(`support_ticket:${ticketId}`);
        console.log(`  🎫 ${socket.userKey} joined support_ticket:${ticketId}`);

        // Mark messages from the other side as read
        if (isAdmin || isAssignedSupport || isUnassignedOpen) {
          // Agent viewing: mark user messages as read
          await models.SupportMessage.update(
            { isRead: true },
            {
              where: {
                ticketId,
                senderRole: { [models.Sequelize.Op.in]: ['care_giver', 'care_recipient'] },
                isRead: false,
              },
            }
          );
        } else if (isUser) {
          // User viewing: mark agent messages as read
          await models.SupportMessage.update(
            { isRead: true },
            {
              where: {
                ticketId,
                senderRole: { [models.Sequelize.Op.in]: ['admin', 'support'] },
                isRead: false,
              },
            }
          );
        }
      } catch (error) {
        console.error('join_support_ticket error:', error);
      }
    });

    /**
     * Leave a support ticket room
     */
    socket.on('leave_support_ticket', ({ ticketId }) => {
      socket.leave(`support_ticket:${ticketId}`);
    });

    /**
     * Send a support message via socket
     * Client emits: socket.emit('send_support_message', { ticketId, content }, callback)
     */
    socket.on('send_support_message', async ({ ticketId, content }, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ error: 'Message content is required' });
        }

        const ticket = await models.SupportTicket.findByPk(ticketId);
        if (!ticket) {
          return callback?.({ error: 'Ticket not found' });
        }

        const isUser = (socket.userRole === ticket.userRole && socket.userId === ticket.userId);
        const isAdmin = socket.userRole === 'admin';
        const isSupport = socket.userRole === 'support';

        if (!isUser && !isAdmin && !isSupport) {
          return callback?.({ error: 'Access denied' });
        }

        // If support/admin replying and ticket is open → assign it
        if ((isSupport || isAdmin) && ticket.status === 'open') {
          await ticket.update({
            status: 'assigned',
            assignedToRole: socket.userRole,
            assignedToId: socket.userId,
          });
        }

        // If support agent, must be the assigned one (unless admin)
        if (isSupport && ticket.status === 'assigned' && ticket.assignedToId !== socket.userId) {
          return callback?.({ error: 'This ticket is assigned to another agent' });
        }

        const message = await models.SupportMessage.create({
          ticketId: parseInt(ticketId),
          senderRole: socket.userRole,
          senderId: socket.userId,
          content: content.trim(),
        });

        await ticket.update({ lastMessageAt: new Date() });

        const messageData = message.toJSON();

        // Broadcast to everyone in the ticket room
        io.to(`support_ticket:${ticketId}`).emit('support_message', messageData);

        if (isUser) {
          // User sent → notify agent rooms
          if (ticket.status === 'open') {
            io.to('support_agents').to('admin_agents').emit('support_ticket_update', {
              ticketId: parseInt(ticketId),
              message: messageData,
              ticket: ticket.toJSON(),
            });
          } else if (ticket.assignedToId) {
            const agentKey = getUserKey(ticket.assignedToRole, ticket.assignedToId);
            io.to(agentKey).emit('support_ticket_update', {
              ticketId: parseInt(ticketId),
              message: messageData,
              ticket: ticket.toJSON(),
            });
            io.to('admin_agents').emit('support_ticket_update', {
              ticketId: parseInt(ticketId),
              message: messageData,
              ticket: ticket.toJSON(),
            });
          }
        } else {
          // Agent replied → notify user
          const userKey = getUserKey(ticket.userRole, ticket.userId);
          io.to(userKey).emit('support_message_notification', {
            ticketId: parseInt(ticketId),
            message: messageData,
          });

          // If ticket was just assigned → notify other agents
          if (ticket.status === 'assigned') {
            io.to('support_agents').emit('support_ticket_claimed', {
              ticketId: parseInt(ticketId),
              assignedToId: ticket.assignedToId,
              assignedToRole: ticket.assignedToRole,
            });
          }
        }

        callback?.({ success: true, message: messageData });
      } catch (error) {
        console.error('send_support_message error:', error);
        callback?.({ error: 'Failed to send message' });
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userKey} (${socket.id})`);

      const sockets = onlineUsers.get(socket.userKey);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userKey);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

const isUserOnline = (role, userId) => {
  const key = getUserKey(role, userId);
  return onlineUsers.has(key) && onlineUsers.get(key).size > 0;
};

module.exports = {
  setupSocket,
  getIO,
  isUserOnline,
};
