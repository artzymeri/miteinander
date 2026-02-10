const { Op } = require('sequelize');
const models = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { sendTicketClosedEmail, sendTicketAssignedEmail } = require('../utils/email');

/**
 * Get or create user's active support ticket.
 * A user can only have one open/assigned ticket at a time.
 * 
 * POST /api/support/ticket
 */
const getOrCreateTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.userRole;

    if (role !== 'care_giver' && role !== 'care_recipient') {
      return errorResponse(res, 'Only care givers and care recipients can create support tickets', 403);
    }

    // Find existing open/assigned ticket
    let ticket = await models.SupportTicket.findOne({
      where: {
        userId,
        userRole: role,
        status: { [Op.in]: ['open', 'assigned'] },
      },
    });

    if (!ticket) {
      ticket = await models.SupportTicket.create({
        userId,
        userRole: role,
        status: 'open',
      });

      // Notify support agents and admins about the new ticket
      try {
        const { getIO } = require('../socket');
        const io = getIO();

        // Get user info for the notification
        let userInfo = null;
        const UserModel = role === 'care_giver' ? models.CareGiver : models.CareRecipient;
        userInfo = await UserModel.findByPk(userId, {
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        });

        io.to('support_agents').to('admin_agents').emit('support_ticket_new', {
          ticket: {
            ...ticket.toJSON(),
            user: userInfo?.toJSON() || null,
            lastMessage: null,
            unreadCount: 0,
          },
        });
      } catch (socketErr) {
        console.error('Socket emit error (new ticket):', socketErr);
      }
    }

    return successResponse(res, { ticket });
  } catch (error) {
    console.error('getOrCreateTicket error:', error);
    return errorResponse(res, 'Failed to get/create ticket', 500);
  }
};

/**
 * Get messages for a ticket
 * 
 * GET /api/support/tickets/:ticketId/messages
 */
const getTicketMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const role = req.userRole;

    const ticket = await models.SupportTicket.findByPk(ticketId);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    // Verify access
    const isUser = (role === ticket.userRole && userId === ticket.userId);
    const isAdmin = role === 'admin';
    const isAssignedSupport = role === 'support' && ticket.assignedToId === userId;
    const isUnassignedOpen = role === 'support' && ticket.status === 'open';

    if (!isUser && !isAdmin && !isAssignedSupport && !isUnassignedOpen) {
      return errorResponse(res, 'Access denied', 403);
    }

    const messages = await models.SupportMessage.findAll({
      where: { ticketId },
      order: [['createdAt', 'ASC']],
    });

    // Enrich messages with sender names
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const plain = msg.toJSON();
        let senderName = null;
        try {
          if (msg.senderRole === 'admin') {
            const admin = await models.Admin.findByPk(msg.senderId, { attributes: ['firstName', 'lastName'] });
            senderName = admin ? `${admin.firstName} ${admin.lastName}` : null;
          } else if (msg.senderRole === 'support') {
            const support = await models.Support.findByPk(msg.senderId, { attributes: ['firstName', 'lastName'] });
            senderName = support ? `${support.firstName} ${support.lastName}` : null;
          } else if (msg.senderRole === 'care_giver') {
            const cg = await models.CareGiver.findByPk(msg.senderId, { attributes: ['firstName', 'lastName'] });
            senderName = cg ? `${cg.firstName} ${cg.lastName}` : null;
          } else if (msg.senderRole === 'care_recipient') {
            const cr = await models.CareRecipient.findByPk(msg.senderId, { attributes: ['firstName', 'lastName'] });
            senderName = cr ? `${cr.firstName} ${cr.lastName}` : null;
          }
        } catch (e) { /* ignore */ }
        return { ...plain, senderName };
      })
    );

    return successResponse(res, { messages: enrichedMessages, ticket });
  } catch (error) {
    console.error('getTicketMessages error:', error);
    return errorResponse(res, 'Failed to get messages', 500);
  }
};

/**
 * Send a support message
 * 
 * POST /api/support/tickets/:ticketId/messages
 */
const sendTicketMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const role = req.userRole;

    if (!content || !content.trim()) {
      return errorResponse(res, 'Content is required', 400);
    }

    const ticket = await models.SupportTicket.findByPk(ticketId);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    // Verify access
    const isUser = (role === ticket.userRole && userId === ticket.userId);
    const isAdmin = role === 'admin';
    const isSupport = role === 'support';

    if (!isUser && !isAdmin && !isSupport) {
      return errorResponse(res, 'Access denied', 403);
    }

    // If support/admin replying and ticket is open → assign it
    if ((isSupport || isAdmin) && ticket.status === 'open') {
      await ticket.update({
        status: 'assigned',
        assignedToRole: role,
        assignedToId: userId,
      });
    }

    // If support agent, must be the assigned one (unless admin)
    if (isSupport && ticket.status === 'assigned' && ticket.assignedToId !== userId) {
      return errorResponse(res, 'This ticket is assigned to another agent', 403);
    }

    const message = await models.SupportMessage.create({
      ticketId: parseInt(ticketId),
      senderRole: role,
      senderId: userId,
      content: content.trim(),
    });

    await ticket.update({ lastMessageAt: new Date() });

    // Emit socket events
    try {
      const { getIO } = require('../socket');
      const io = getIO();

      const messageData = message.toJSON();

      // Resolve sender name
      let senderName = null;
      try {
        if (role === 'admin') {
          const admin = await models.Admin.findByPk(userId, { attributes: ['firstName', 'lastName'] });
          senderName = admin ? `${admin.firstName} ${admin.lastName}` : null;
        } else if (role === 'support') {
          const support = await models.Support.findByPk(userId, { attributes: ['firstName', 'lastName'] });
          senderName = support ? `${support.firstName} ${support.lastName}` : null;
        } else if (role === 'care_giver') {
          const cg = await models.CareGiver.findByPk(userId, { attributes: ['firstName', 'lastName'] });
          senderName = cg ? `${cg.firstName} ${cg.lastName}` : null;
        } else if (role === 'care_recipient') {
          const cr = await models.CareRecipient.findByPk(userId, { attributes: ['firstName', 'lastName'] });
          senderName = cr ? `${cr.firstName} ${cr.lastName}` : null;
        }
      } catch (e) { /* ignore */ }
      messageData.senderName = senderName;

      // Send to ticket room (user viewing their chat)
      io.to(`support_ticket:${ticketId}`).emit('support_message', messageData);

      if (isUser) {
        // User sent a message → notify support/admin rooms
        if (ticket.status === 'open') {
          // Broadcast to all support agents + admins
          io.to('support_agents').to('admin_agents').emit('support_ticket_update', {
            ticketId: parseInt(ticketId),
            message: messageData,
            ticket: ticket.toJSON(),
          });
        } else if (ticket.assignedToId) {
          // Only notify assigned agent + admins
          io.to(`${ticket.assignedToRole}:${ticket.assignedToId}`).emit('support_ticket_update', {
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
        // Agent/admin replied → notify the user
        const userKey = `${ticket.userRole}:${ticket.userId}`;
        io.to(userKey).emit('support_message_notification', {
          ticketId: parseInt(ticketId),
          message: messageData,
        });

        // If this was the first reply (assigned now) → hide from other support agents
        if (ticket.status === 'assigned') {
          io.to('support_agents').to('admin_agents').emit('support_ticket_claimed', {
            ticketId: parseInt(ticketId),
            assignedToId: ticket.assignedToId,
            assignedToRole: ticket.assignedToRole,
          });
        }
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    return successResponse(res, { message: message.toJSON(), ticket: ticket.toJSON() }, 'Message sent', 201);
  } catch (error) {
    console.error('sendTicketMessage error:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

/**
 * Get all tickets (for admin/support)
 * Admin sees all. Support sees open + their assigned.
 * 
 * GET /api/support/tickets
 */
const getTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.userRole;

    let whereClause;
    if (role === 'admin') {
      whereClause = {}; // Admin sees all
    } else if (role === 'support') {
      whereClause = {
        [Op.or]: [
          { status: 'open' },
          { assignedToId: userId, assignedToRole: 'support' },
        ],
      };
    } else {
      return errorResponse(res, 'Access denied', 403);
    }

    const tickets = await models.SupportTicket.findAll({
      where: whereClause,
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
    });

    // Enrich with user info and last message
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const plain = ticket.toJSON();

        // Get user info
        let user = null;
        if (ticket.userRole === 'care_giver') {
          user = await models.CareGiver.findByPk(ticket.userId, {
            attributes: ['id', 'firstName', 'lastName', 'profileImageUrl', 'email'],
          });
        } else {
          user = await models.CareRecipient.findByPk(ticket.userId, {
            attributes: ['id', 'firstName', 'lastName', 'profileImageUrl', 'email'],
          });
        }

        // Get last message
        const lastMessage = await models.SupportMessage.findOne({
          where: { ticketId: ticket.id },
          order: [['createdAt', 'DESC']],
        });

        // Get unread count (messages from user not read by agent)
        const unreadCount = await models.SupportMessage.count({
          where: {
            ticketId: ticket.id,
            senderRole: { [Op.in]: ['care_giver', 'care_recipient'] },
            isRead: false,
          },
        });

        // Get assigned staff name
        let assignedStaff = null;
        if (ticket.assignedToId) {
          try {
            if (ticket.assignedToRole === 'admin') {
              const admin = await models.Admin.findByPk(ticket.assignedToId, { attributes: ['id', 'firstName', 'lastName'] });
              assignedStaff = admin ? admin.toJSON() : null;
            } else if (ticket.assignedToRole === 'support') {
              const support = await models.Support.findByPk(ticket.assignedToId, { attributes: ['id', 'firstName', 'lastName'] });
              assignedStaff = support ? support.toJSON() : null;
            }
          } catch (e) { /* ignore */ }
        }

        return {
          ...plain,
          user: user?.toJSON() || null,
          lastMessage: lastMessage?.toJSON() || null,
          unreadCount,
          assignedStaff,
        };
      })
    );

    return successResponse(res, { tickets: enrichedTickets });
  } catch (error) {
    console.error('getTickets error:', error);
    return errorResponse(res, 'Failed to get tickets', 500);
  }
};

/**
 * Close a ticket
 * PUT /api/support/tickets/:ticketId/close
 */
const closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const role = req.userRole;

    if (role !== 'admin' && role !== 'support') {
      return errorResponse(res, 'Access denied', 403);
    }

    const ticket = await models.SupportTicket.findByPk(ticketId);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    await ticket.update({ status: 'closed' });

    // Send ticket closed email to the user (non-blocking)
    try {
      const UserModel = ticket.userRole === 'care_giver' ? models.CareGiver : models.CareRecipient;
      const ticketUser = await UserModel.findByPk(ticket.userId, {
        attributes: ['firstName', 'email'],
      });
      if (ticketUser) {
        sendTicketClosedEmail(ticketUser.email, ticketUser.firstName, ticket.id).catch((err) => {
          console.error('Failed to send ticket closed email:', err);
        });
      }
    } catch (emailErr) {
      console.error('Error preparing ticket closed email:', emailErr);
    }

    // Notify via socket
    try {
      const { getIO } = require('../socket');
      const io = getIO();

      const ticketData = ticket.toJSON();

      // Notify the ticket owner (care_giver or care_recipient)
      const userKey = `${ticket.userRole}:${ticket.userId}`;
      io.to(userKey).emit('support_ticket_closed', {
        ticketId: parseInt(ticketId),
        ticket: ticketData,
      });

      // Notify everyone in the ticket room
      io.to(`support_ticket:${ticketId}`).emit('support_ticket_closed', {
        ticketId: parseInt(ticketId),
        ticket: ticketData,
      });

      // Notify support agents and admins
      io.to('support_agents').to('admin_agents').emit('support_ticket_closed', {
        ticketId: parseInt(ticketId),
        ticket: ticketData,
      });
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    return successResponse(res, { ticket: ticket.toJSON() }, 'Ticket closed');
  } catch (error) {
    console.error('closeTicket error:', error);
    return errorResponse(res, 'Failed to close ticket', 500);
  }
};

/**
 * Assign a ticket to a support staff member (admin only)
 * PUT /api/support/tickets/:ticketId/assign
 */
const assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { supportId } = req.body;
    const role = req.userRole;

    if (role !== 'admin') {
      return errorResponse(res, 'Only admins can assign tickets', 403);
    }

    const ticket = await models.SupportTicket.findByPk(ticketId);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    if (ticket.status === 'closed') {
      return errorResponse(res, 'Cannot assign a closed ticket', 400);
    }

    // If supportId is null, unassign the ticket
    if (!supportId) {
      await ticket.update({
        status: 'open',
        assignedToRole: null,
        assignedToId: null,
      });

      // Notify via socket
      try {
        const { getIO } = require('../socket');
        const io = getIO();
        const payload = {
          ticketId: parseInt(ticketId),
          ticket: ticket.toJSON(),
        };
        io.to('support_agents').to('admin_agents').emit('support_ticket_assigned', payload);
        // Also notify the ticket user
        const userKey = `${ticket.userRole}:${ticket.userId}`;
        io.to(userKey).emit('support_ticket_assigned', payload);
      } catch (socketErr) {
        console.error('Socket emit error:', socketErr);
      }

      return successResponse(res, { ticket: ticket.toJSON() }, 'Ticket unassigned');
    }

    // Verify the support user exists and is active
    const support = await models.Support.findByPk(supportId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
    });
    if (!support) return errorResponse(res, 'Support staff not found', 404);
    if (!support.isActive) return errorResponse(res, 'Support staff is inactive', 400);

    await ticket.update({
      status: 'assigned',
      assignedToRole: 'support',
      assignedToId: supportId,
    });

    // Send ticket assigned email to the support staff (non-blocking)
    try {
      const UserModel = ticket.userRole === 'care_giver' ? models.CareGiver : models.CareRecipient;
      const ticketUser = await UserModel.findByPk(ticket.userId, {
        attributes: ['firstName', 'lastName'],
      });
      const userName = ticketUser ? `${ticketUser.firstName} ${ticketUser.lastName}` : 'Unbekannt';
      sendTicketAssignedEmail(support.email, support.firstName, ticket.id, userName).catch((err) => {
        console.error('Failed to send ticket assigned email:', err);
      });
    } catch (emailErr) {
      console.error('Error preparing ticket assigned email:', emailErr);
    }

    // Notify via socket
    try {
      const { getIO } = require('../socket');
      const io = getIO();

      const payload = {
        ticketId: parseInt(ticketId),
        ticket: ticket.toJSON(),
        assignedTo: support.toJSON(),
      };

      // Notify all support agents and admins (assigned agent is in support_agents room)
      io.to('support_agents').to('admin_agents').emit('support_ticket_assigned', payload);

      // Also notify the ticket user
      const userKey = `${ticket.userRole}:${ticket.userId}`;
      io.to(userKey).emit('support_ticket_assigned', payload);
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    return successResponse(res, { ticket: ticket.toJSON(), assignedTo: support.toJSON() }, 'Ticket assigned');
  } catch (error) {
    console.error('assignTicket error:', error);
    return errorResponse(res, 'Failed to assign ticket', 500);
  }
};

/**
 * Get all active support staff (for assignment dropdown)
 * GET /api/support/staff
 */
const getActiveStaff = async (req, res) => {
  try {
    const role = req.userRole;
    if (role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const staff = await models.Support.findAll({
      where: { isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    return successResponse(res, { staff });
  } catch (error) {
    console.error('getActiveStaff error:', error);
    return errorResponse(res, 'Failed to get staff', 500);
  }
};

module.exports = {
  getOrCreateTicket,
  getTicketMessages,
  sendTicketMessage,
  getTickets,
  closeTicket,
  assignTicket,
  getActiveStaff,
};
