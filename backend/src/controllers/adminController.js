const models = require('../models');
const { successResponse, errorResponse, getPagination, getPagingData } = require('../utils/helpers');
const { Op } = require('sequelize');
const config = require('../config/config');

const { Admin, Support, CareGiver, CareRecipient, CareNeed, Review, SettlementRequest, sequelize } = models;

// Lazy-init Stripe only when needed
let _stripe = null;
const getStripe = () => {
  if (!_stripe && config.stripe.secretKey) {
    _stripe = require('stripe')(config.stripe.secretKey);
  }
  return _stripe;
};

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get counts for all user types
    const [
      totalAdmins,
      totalSupports,
      totalCareGivers,
      totalCareRecipients,
      activeCareGivers,
      activeCareRecipients,
      recentCareGivers,
      recentCareRecipients,
      verifiedCareGivers,
    ] = await Promise.all([
      Admin.count(),
      Support.count(),
      CareGiver.count(),
      CareRecipient.count(),
      CareGiver.count({ where: { isActive: true } }),
      CareRecipient.count({ where: { isActive: true } }),
      CareGiver.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      CareRecipient.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      CareGiver.count({ where: { isVerified: true } }),
    ]);

    // Get registration trend (last 30 days grouped by day)
    const registrationTrend = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        'care_giver' as type,
        COUNT(*) as count
      FROM care_givers 
      WHERE created_at >= :thirtyDaysAgo
      GROUP BY DATE(created_at)
      UNION ALL
      SELECT 
        DATE(created_at) as date,
        'care_recipient' as type,
        COUNT(*) as count
      FROM care_recipients 
      WHERE created_at >= :thirtyDaysAgo
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, {
      replacements: { thirtyDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // Get recent registrations (last 10)
    const [recentCareGiversList, recentCareRecipientsList] = await Promise.all([
      CareGiver.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'isActive', 'isVerified'],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      CareRecipient.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'isActive'],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
    ]);

    return successResponse(res, {
      totals: {
        admins: totalAdmins,
        supports: totalSupports,
        careGivers: totalCareGivers,
        careRecipients: totalCareRecipients,
        totalUsers: totalCareGivers + totalCareRecipients,
      },
      active: {
        careGivers: activeCareGivers,
        careRecipients: activeCareRecipients,
      },
      verified: {
        careGivers: verifiedCareGivers,
      },
      last30Days: {
        careGivers: recentCareGivers,
        careRecipients: recentCareRecipients,
        total: recentCareGivers + recentCareRecipients,
      },
      registrationTrend,
      recentRegistrations: {
        careGivers: recentCareGiversList,
        careRecipients: recentCareRecipientsList,
      },
    }, 'Dashboard analytics retrieved successfully');
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return errorResponse(res, 'Failed to retrieve analytics', 500, 'ANALYTICS_ERROR');
  }
};

/**
 * Create a new support employee
 */
const createSupport = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, department } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return errorResponse(res, 'First name, last name, email, and password are required', 400, 'VALIDATION_ERROR');
    }

    // Check for duplicate email
    const existing = await Support.findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 'A support employee with this email already exists', 409, 'DUPLICATE_EMAIL');
    }

    // Create support (password hashed via model beforeCreate hook)
    const support = await Support.create({
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      department: department || null,
    });

    // Return without password
    const created = await Support.findByPk(support.id, {
      attributes: { exclude: ['password'] },
    });

    return successResponse(res, created, 'Support employee created successfully', 201);
  } catch (error) {
    console.error('Create support error:', error);
    return errorResponse(res, 'Failed to create support employee', 500, 'CREATE_ERROR');
  }
};

/**
 * Get all support employees with pagination
 */
const getAllSupports = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const data = await Support.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: limitVal,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, getPagingData(data, page, limitVal), 'Supports retrieved successfully');
  } catch (error) {
    console.error('Get supports error:', error);
    return errorResponse(res, 'Failed to retrieve supports', 500, 'FETCH_ERROR');
  }
};

/**
 * Get support by ID
 */
const getSupportById = async (req, res) => {
  try {
    const { id } = req.params;
    const support = await Support.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!support) {
      return errorResponse(res, 'Support not found', 404, 'NOT_FOUND');
    }

    return successResponse(res, support, 'Support retrieved successfully');
  } catch (error) {
    console.error('Get support error:', error);
    return errorResponse(res, 'Failed to retrieve support', 500, 'FETCH_ERROR');
  }
};

/**
 * Update support
 */
const updateSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const support = await Support.findByPk(id);
    if (!support) {
      return errorResponse(res, 'Support not found', 404, 'NOT_FOUND');
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.id;

    await support.update(updates);

    const updatedSupport = await Support.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    return successResponse(res, updatedSupport, 'Support updated successfully');
  } catch (error) {
    console.error('Update support error:', error);
    return errorResponse(res, 'Failed to update support', 500, 'UPDATE_ERROR');
  }
};

/**
 * Delete support
 */
const deleteSupport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const support = await Support.findByPk(id);
    if (!support) {
      return errorResponse(res, 'Support not found', 404, 'NOT_FOUND');
    }

    await support.destroy();

    return successResponse(res, null, 'Support deleted successfully');
  } catch (error) {
    console.error('Delete support error:', error);
    return errorResponse(res, 'Failed to delete support', 500, 'DELETE_ERROR');
  }
};

/**
 * Get all care givers with pagination
 */
const getAllCareGivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive, isVerified } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const data = await CareGiver.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: limitVal,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, getPagingData(data, page, limitVal), 'Care givers retrieved successfully');
  } catch (error) {
    console.error('Get care givers error:', error);
    return errorResponse(res, 'Failed to retrieve care givers', 500, 'FETCH_ERROR');
  }
};

/**
 * Get care giver by ID
 */
const getCareGiverById = async (req, res) => {
  try {
    const { id } = req.params;
    const careGiver = await CareGiver.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!careGiver) {
      return errorResponse(res, 'Care giver not found', 404, 'NOT_FOUND');
    }

    return successResponse(res, careGiver, 'Care giver retrieved successfully');
  } catch (error) {
    console.error('Get care giver error:', error);
    return errorResponse(res, 'Failed to retrieve care giver', 500, 'FETCH_ERROR');
  }
};

/**
 * Update care giver
 */
const updateCareGiver = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const careGiver = await CareGiver.findByPk(id);
    if (!careGiver) {
      return errorResponse(res, 'Care giver not found', 404, 'NOT_FOUND');
    }

    delete updates.password;
    delete updates.id;

    await careGiver.update(updates);

    const updatedCareGiver = await CareGiver.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    return successResponse(res, updatedCareGiver, 'Care giver updated successfully');
  } catch (error) {
    console.error('Update care giver error:', error);
    return errorResponse(res, 'Failed to update care giver', 500, 'UPDATE_ERROR');
  }
};

/**
 * Delete care giver
 */
const deleteCareGiver = async (req, res) => {
  try {
    const { id } = req.params;
    
    const careGiver = await CareGiver.findByPk(id);
    if (!careGiver) {
      return errorResponse(res, 'Care giver not found', 404, 'NOT_FOUND');
    }

    await careGiver.destroy();

    return successResponse(res, null, 'Care giver deleted successfully');
  } catch (error) {
    console.error('Delete care giver error:', error);
    return errorResponse(res, 'Failed to delete care giver', 500, 'DELETE_ERROR');
  }
};

/**
 * Get all care recipients with pagination
 */
const getAllCareRecipients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const data = await CareRecipient.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: limitVal,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, getPagingData(data, page, limitVal), 'Care recipients retrieved successfully');
  } catch (error) {
    console.error('Get care recipients error:', error);
    return errorResponse(res, 'Failed to retrieve care recipients', 500, 'FETCH_ERROR');
  }
};

/**
 * Get care recipient by ID
 */
const getCareRecipientById = async (req, res) => {
  try {
    const { id } = req.params;
    const careRecipient = await CareRecipient.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!careRecipient) {
      return errorResponse(res, 'Care recipient not found', 404, 'NOT_FOUND');
    }

    return successResponse(res, careRecipient, 'Care recipient retrieved successfully');
  } catch (error) {
    console.error('Get care recipient error:', error);
    return errorResponse(res, 'Failed to retrieve care recipient', 500, 'FETCH_ERROR');
  }
};

/**
 * Update care recipient
 */
const updateCareRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const careRecipient = await CareRecipient.findByPk(id);
    if (!careRecipient) {
      return errorResponse(res, 'Care recipient not found', 404, 'NOT_FOUND');
    }

    delete updates.password;
    delete updates.id;

    await careRecipient.update(updates);

    const updatedCareRecipient = await CareRecipient.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    return successResponse(res, updatedCareRecipient, 'Care recipient updated successfully');
  } catch (error) {
    console.error('Update care recipient error:', error);
    return errorResponse(res, 'Failed to update care recipient', 500, 'UPDATE_ERROR');
  }
};

/**
 * Delete care recipient
 */
const deleteCareRecipient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const careRecipient = await CareRecipient.findByPk(id);
    if (!careRecipient) {
      return errorResponse(res, 'Care recipient not found', 404, 'NOT_FOUND');
    }

    await careRecipient.destroy();

    return successResponse(res, null, 'Care recipient deleted successfully');
  } catch (error) {
    console.error('Delete care recipient error:', error);
    return errorResponse(res, 'Failed to delete care recipient', 500, 'DELETE_ERROR');
  }
};

/**
 * Get all care needs
 */
const getAllCareNeeds = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const where = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const careNeeds = await CareNeed.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['labelEn', 'ASC']],
    });

    return successResponse(res, careNeeds, 'Care needs retrieved successfully');
  } catch (error) {
    console.error('Get care needs error:', error);
    return errorResponse(res, 'Failed to retrieve care needs', 500, 'FETCH_ERROR');
  }
};

/**
 * Create care need
 */
const createCareNeed = async (req, res) => {
  try {
    const { labelEn, labelDe, labelFr, descriptionEn, descriptionDe, descriptionFr, icon, sortOrder } = req.body;

    if (!labelEn || !labelDe || !labelFr) {
      return errorResponse(res, 'All language labels are required', 400, 'VALIDATION_ERROR');
    }

    const careNeed = await CareNeed.create({
      labelEn,
      labelDe,
      labelFr,
      descriptionEn,
      descriptionDe,
      descriptionFr,
      icon,
      sortOrder: sortOrder || 0,
      createdBy: req.user?.id,
    });

    return successResponse(res, careNeed, 'Care need created successfully', 201);
  } catch (error) {
    console.error('Create care need error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'A care need with this key already exists', 400, 'DUPLICATE_KEY');
    }
    return errorResponse(res, 'Failed to create care need', 500, 'CREATE_ERROR');
  }
};

/**
 * Update care need
 */
const updateCareNeed = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const careNeed = await CareNeed.findByPk(id);
    if (!careNeed) {
      return errorResponse(res, 'Care need not found', 404, 'NOT_FOUND');
    }

    updates.updatedBy = req.user?.id;
    delete updates.id;
    delete updates.key; // Don't allow key changes

    await careNeed.update(updates);

    return successResponse(res, careNeed, 'Care need updated successfully');
  } catch (error) {
    console.error('Update care need error:', error);
    return errorResponse(res, 'Failed to update care need', 500, 'UPDATE_ERROR');
  }
};

/**
 * Delete care need
 */
const deleteCareNeed = async (req, res) => {
  try {
    const { id } = req.params;
    
    const careNeed = await CareNeed.findByPk(id);
    if (!careNeed) {
      return errorResponse(res, 'Care need not found', 404, 'NOT_FOUND');
    }

    await careNeed.destroy();

    return successResponse(res, null, 'Care need deleted successfully');
  } catch (error) {
    console.error('Delete care need error:', error);
    return errorResponse(res, 'Failed to delete care need', 500, 'DELETE_ERROR');
  }
};

/**
 * Get subscription details for a user (care giver or care recipient)
 * GET /api/admin/subscription/:userType/:userId
 * GET /api/support/subscription/:userType/:userId
 */
const getUserSubscriptionDetails = async (req, res) => {
  try {
    const { userType, userId } = req.params;

    if (!['care-giver', 'care-recipient'].includes(userType)) {
      return errorResponse(res, 'Invalid user type', 400, 'INVALID_USER_TYPE');
    }

    const Model = userType === 'care-giver' ? CareGiver : CareRecipient;
    const user = await Model.findByPk(userId, {
      attributes: ['id', 'subscriptionStatus', 'subscriptionId', 'trialEndsAt', 'subscriptionEndsAt', 'stripeCustomerId'],
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404, 'NOT_FOUND');
    }

    const raw = user.get({ plain: true });
    let effectiveStatus = raw.subscriptionStatus || 'none';
    if (effectiveStatus === 'trial' && raw.trialEndsAt) {
      if (new Date() > new Date(raw.trialEndsAt)) {
        effectiveStatus = 'expired';
      }
    }

    const isCancelingFromDb = effectiveStatus === 'active' && raw.subscriptionEndsAt != null;

    let currentPeriodEnd = null;
    let plan = null;
    let isCanceling = isCancelingFromDb;
    const stripe = getStripe();

    if (stripe && raw.subscriptionId && ['active', 'past_due'].includes(effectiveStatus)) {
      try {
        const sub = await stripe.subscriptions.retrieve(raw.subscriptionId);
        const item = sub.items?.data?.[0];
        const periodEnd = sub.current_period_end || item?.current_period_end;
        if (periodEnd) {
          currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
        }
        const priceId = item?.price?.id || item?.plan?.id;
        if (priceId === config.stripe.monthlyPriceId) plan = 'monthly';
        else if (priceId === config.stripe.yearlyPriceId) plan = 'yearly';
        // Use Stripe's authoritative cancel_at_period_end flag
        if (sub.cancel_at_period_end) {
          isCanceling = true;
        }
      } catch (stripeErr) {
        console.error('Stripe fetch error for admin subscription details:', stripeErr.message);
      }
    }

    // For trial users, also try to get plan info from Stripe
    if (stripe && raw.subscriptionId && effectiveStatus === 'trial' && !plan) {
      try {
        const sub = await stripe.subscriptions.retrieve(raw.subscriptionId);
        const item = sub.items?.data?.[0];
        const priceId = item?.price?.id || item?.plan?.id;
        if (priceId === config.stripe.monthlyPriceId) plan = 'monthly';
        else if (priceId === config.stripe.yearlyPriceId) plan = 'yearly';
      } catch (stripeErr) {
        // silently ignore
      }
    }

    return successResponse(res, {
      subscriptionStatus: effectiveStatus,
      trialEndsAt: raw.trialEndsAt || null,
      subscriptionEndsAt: raw.subscriptionEndsAt || null,
      currentPeriodEnd,
      plan,
      isCanceling,
    }, 'Subscription details retrieved');
  } catch (error) {
    console.error('getUserSubscriptionDetails error:', error);
    return errorResponse(res, 'Failed to retrieve subscription details', 500, 'FETCH_ERROR');
  }
};

/**
 * Get reviews for a specific caregiver (admin/support)
 * GET /api/admin/care-givers/:id/reviews
 */
const getCaregiverReviews = async (req, res) => {
  try {
    const caregiverId = parseInt(req.params.id);
    if (isNaN(caregiverId)) {
      return errorResponse(res, 'Invalid caregiver ID', 400);
    }

    const reviews = await Review.findAll({
      where: { careGiverId: caregiverId },
      include: [
        {
          model: CareRecipient,
          as: 'careRecipient',
          attributes: ['id', 'firstName', 'lastName', 'profileImageUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, { reviews });
  } catch (error) {
    console.error('getCaregiverReviews error:', error);
    return errorResponse(res, 'Failed to fetch reviews', 500);
  }
};

/**
 * Get settlement details for a user (care giver or care recipient)
 * GET /api/admin/settlement/:userType/:userId
 * GET /api/support/settlement/:userType/:userId
 */
const getUserSettlementDetails = async (req, res) => {
  try {
    const { userType, userId } = req.params;

    if (!['care-giver', 'care-recipient'].includes(userType)) {
      return errorResponse(res, 'Invalid user type', 400, 'INVALID_USER_TYPE');
    }

    if (userType === 'care-recipient') {
      const recipient = await CareRecipient.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'isSettled', 'settledWithCaregiverId', 'settledAt'],
      });
      if (!recipient) {
        return errorResponse(res, 'User not found', 404, 'NOT_FOUND');
      }

      let settledWith = null;
      if (recipient.isSettled && recipient.settledWithCaregiverId) {
        const cg = await CareGiver.findByPk(recipient.settledWithCaregiverId, {
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
          paranoid: false,
        });
        if (cg) {
          settledWith = { id: cg.id, firstName: cg.firstName, lastName: cg.lastName, email: cg.email, profileImageUrl: cg.profileImageUrl };
        }
      }

      // Check for pending request
      const pendingRequest = await SettlementRequest.findOne({
        where: { careRecipientId: userId, status: 'pending' },
        include: [{
          model: CareGiver,
          as: 'careGiver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          paranoid: false,
        }],
        order: [['createdAt', 'DESC']],
      });

      return successResponse(res, {
        isSettled: recipient.isSettled || false,
        settledAt: recipient.settledAt,
        settledWith,
        pendingRequest: pendingRequest ? {
          id: pendingRequest.id,
          createdAt: pendingRequest.createdAt,
          careGiver: pendingRequest.careGiver ? {
            id: pendingRequest.careGiver.id,
            firstName: pendingRequest.careGiver.firstName,
            lastName: pendingRequest.careGiver.lastName,
            email: pendingRequest.careGiver.email,
          } : null,
        } : null,
      }, 'Settlement details retrieved');
    }

    // care-giver
    const settledClients = await CareRecipient.findAll({
      where: { isSettled: true, settledWithCaregiverId: userId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl', 'settledAt'],
      paranoid: false,
    });

    const pendingRequests = await SettlementRequest.findAll({
      where: { careGiverId: userId, status: 'pending' },
      include: [{
        model: CareRecipient,
        as: 'careRecipient',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        paranoid: false,
      }],
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, {
      settledClientsCount: settledClients.length,
      settledClients: settledClients.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        profileImageUrl: c.profileImageUrl,
        settledAt: c.settledAt,
      })),
      pendingRequestsCount: pendingRequests.length,
      pendingRequests: pendingRequests.map(r => ({
        id: r.id,
        createdAt: r.createdAt,
        careRecipient: r.careRecipient ? {
          id: r.careRecipient.id,
          firstName: r.careRecipient.firstName,
          lastName: r.careRecipient.lastName,
          email: r.careRecipient.email,
        } : null,
      })),
    }, 'Settlement details retrieved');
  } catch (error) {
    console.error('getUserSettlementDetails error:', error);
    return errorResponse(res, 'Failed to retrieve settlement details', 500, 'FETCH_ERROR');
  }
};

module.exports = {
  getDashboardAnalytics,
  createSupport,
  getAllSupports,
  getSupportById,
  updateSupport,
  deleteSupport,
  getAllCareGivers,
  getCareGiverById,
  updateCareGiver,
  deleteCareGiver,
  getAllCareRecipients,
  getCareRecipientById,
  updateCareRecipient,
  deleteCareRecipient,
  getAllCareNeeds,
  createCareNeed,
  updateCareNeed,
  deleteCareNeed,
  getUserSubscriptionDetails,
  getCaregiverReviews,
  getUserSettlementDetails,
};
