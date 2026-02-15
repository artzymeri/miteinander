const models = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

const { CareGiver, CareNeed, CareRecipient, SettlementRequest } = models;

/**
 * Helper to resolve care need/skill IDs to their full data
 * @param {number[]} ids - Array of care need IDs
 * @param {Object} careNeedsMap - Map of care need ID to care need data
 * @returns {Object[]} - Array of resolved care need objects with id, key, and labels
 */
const resolveSkills = (ids, careNeedsMap) => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => careNeedsMap[id])
    .filter(Boolean);
};

/**
 * Get paginated care givers for care recipients to browse
 * Implements infinite scroll with limit/offset pagination
 * 
 * SECURITY: 
 * - Only authenticated care_recipients can access
 * - No sensitive data exposed (password, etc.)
 * - Input validation on all query params
 * 
 * NOTE: skills is stored as JSON array of IDs (integers), not text
 * We resolve these IDs to their labels dynamically from the care_needs table
 */
const findCaregivers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 25)); // Max 50, default 25
    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const whereClause = {
      isActive: true, // Only show active users
    };
    
    // Search by name, city or postal code
    const search = req.query.search?.trim();
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { postalCode: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { occupation: { [Op.like]: `%${search}%` } },
      ];
    }
    
    // Filter by country
    if (req.query.country) {
      whereClause.country = req.query.country;
    }
    
    // Filter by city
    if (req.query.city) {
      whereClause.city = { [Op.like]: `%${req.query.city}%` };
    }
    
    // Filter by skills (care needs)
    // skills is stored as JSON array of IDs
    if (req.query.skills) {
      const skillsFilter = Array.isArray(req.query.skills) 
        ? req.query.skills.map(id => parseInt(id)).filter(id => !isNaN(id))
        : [parseInt(req.query.skills)].filter(id => !isNaN(id));
      
      // For JSON array field, we need to check if any of the requested skill IDs are present
      if (skillsFilter.length > 0) {
        const skillConditions = skillsFilter.map(id => 
          models.sequelize.literal(`JSON_CONTAINS(skills, '${id}')`)
        );
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({
          [Op.or]: skillConditions
        });
      }
    }
    
    // Fetch all active care needs to resolve IDs to labels
    const allCareNeeds = await CareNeed.findAll({
      where: { isActive: true },
      attributes: ['id', 'key', 'labelEn', 'labelDe', 'labelFr'],
    });
    
    // Create a map for quick lookup
    const careNeedsMap = {};
    allCareNeeds.forEach(cn => {
      careNeedsMap[cn.id] = {
        id: cn.id,
        key: cn.key,
        labelEn: cn.labelEn,
        labelDe: cn.labelDe,
        labelFr: cn.labelFr,
      };
    });
    
    // Fetch caregivers with pagination
    const { count, rows: caregivers } = await CareGiver.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'firstName',
        'lastName',
        'city',
        'postalCode',
        'country',
        'skills',
        'experienceYears',
        'occupation',
        'bio',
        'profileImageUrl',
        'rating',
        'reviewCount',
        'isVerified',
        'createdAt',
        // Explicitly exclude sensitive fields
        // 'email', 'password', 'phone', 'address', etc. are NOT included
      ],
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return successResponse(res, {
      caregivers: caregivers.map(caregiver => ({
        id: caregiver.id,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName?.charAt(0) + '.', // Only show initial for privacy
        city: caregiver.city,
        postalCode: caregiver.postalCode,
        country: caregiver.country,
        skills: resolveSkills(caregiver.skills, careNeedsMap),
        experienceYears: caregiver.experienceYears,
        occupation: caregiver.occupation,
        bio: caregiver.bio,
        profileImageUrl: caregiver.profileImageUrl,
        rating: caregiver.rating,
        reviewCount: caregiver.reviewCount,
        isVerified: caregiver.isVerified,
        createdAt: caregiver.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count,
        limit,
        hasMore,
      },
    }, 'Caregivers retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single caregiver's public profile
 * 
 * SECURITY:
 * - Only authenticated care_recipients can access
 * - Limited data exposure - no sensitive info
 */
const getCaregiverProfile = async (req, res, next) => {
  try {
    const caregiverId = parseInt(req.params.id);
    
    if (isNaN(caregiverId)) {
      return errorResponse(res, 'Invalid caregiver ID', 400, 'INVALID_ID');
    }
    
    // Fetch care needs for resolving IDs
    const allCareNeeds = await CareNeed.findAll({
      where: { isActive: true },
      attributes: ['id', 'key', 'labelEn', 'labelDe', 'labelFr'],
    });
    
    const careNeedsMap = {};
    allCareNeeds.forEach(cn => {
      careNeedsMap[cn.id] = {
        id: cn.id,
        key: cn.key,
        labelEn: cn.labelEn,
        labelDe: cn.labelDe,
        labelFr: cn.labelFr,
      };
    });
    
    const caregiver = await CareGiver.findOne({
      where: {
        id: caregiverId,
        isActive: true,
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'city',
        'postalCode',
        'country',
        'skills',
        'bio',
        'experienceYears',
        'occupation',
        'profileImageUrl',
        'rating',
        'reviewCount',
        'isVerified',
        'createdAt',
        // More details can be shown on profile view
        // But still exclude: email, password, phone, exact address
      ],
    });
    
    if (!caregiver) {
      return errorResponse(res, 'Caregiver not found', 404, 'CAREGIVER_NOT_FOUND');
    }
    
    // Safely parse certifications
    let certifications = [];
    if (caregiver.certifications) {
      try {
        certifications = JSON.parse(caregiver.certifications);
      } catch {
        certifications = caregiver.certifications ? [caregiver.certifications] : [];
      }
    }
    
    return successResponse(res, {
      caregiver: {
        id: caregiver.id,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName?.charAt(0) + '.', // Privacy: only initial
        city: caregiver.city,
        postalCode: caregiver.postalCode,
        country: caregiver.country,
        skills: resolveSkills(caregiver.skills, careNeedsMap),
        bio: caregiver.bio,
        experienceYears: caregiver.experienceYears,
        occupation: caregiver.occupation,
        certifications,
        profileImageUrl: caregiver.profileImageUrl,
        rating: caregiver.rating,
        reviewCount: caregiver.reviewCount,
        isVerified: caregiver.isVerified,
        memberSince: caregiver.createdAt,
      },
    }, 'Caregiver profile retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get available filter options (countries, cities, skills)
 */
const getFilterOptions = async (req, res, next) => {
  try {
    // Get distinct countries from caregivers
    const countries = await CareGiver.findAll({
      attributes: [[models.sequelize.fn('DISTINCT', models.sequelize.col('country')), 'country']],
      where: { isActive: true, country: { [Op.ne]: null } },
      raw: true,
    });
    
    // Get distinct cities (optionally filtered by country)
    const cityWhere = { isActive: true, city: { [Op.ne]: null } };
    if (req.query.country) {
      cityWhere.country = req.query.country;
    }
    
    const cities = await CareGiver.findAll({
      attributes: [[models.sequelize.fn('DISTINCT', models.sequelize.col('city')), 'city']],
      where: cityWhere,
      raw: true,
    });
    
    // Get all care needs/skills from config
    const skills = await CareNeed.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });
    
    return successResponse(res, {
      countries: countries.map(c => c.country).filter(Boolean).sort(),
      cities: cities.map(c => c.city).filter(Boolean).sort(),
      skills: skills.map(cn => ({
        id: cn.id,
        key: cn.key,
        labelEn: cn.labelEn,
        labelDe: cn.labelDe,
        labelFr: cn.labelFr,
      })),
    }, 'Filter options retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current recipient's own profile
 * 
 * SECURITY:
 * - Only authenticated care_recipients can access their own profile
 * - Returns full profile data (not public view)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    
    // Fetch care needs for resolving IDs
    const allCareNeeds = await CareNeed.findAll({
      where: { isActive: true },
      attributes: ['id', 'key', 'labelEn', 'labelDe', 'labelFr'],
    });
    
    const careNeedsMap = {};
    allCareNeeds.forEach(cn => {
      careNeedsMap[cn.id] = {
        id: cn.id,
        key: cn.key,
        labelEn: cn.labelEn,
        labelDe: cn.labelDe,
        labelFr: cn.labelFr,
      };
    });
    
    const recipient = await CareRecipient.findByPk(recipientId, {
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'dateOfBirth',
        'address',
        'city',
        'postalCode',
        'country',
        'bio',
        'careNeeds',
        'profileImageUrl',
        'isSettled',
        'settledWithCaregiverId',
        'settledAt',
        'createdAt',
      ],
    });
    
    if (!recipient) {
      return errorResponse(res, 'Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    // If settled, fetch the caregiver name
    let settledWithCaregiver = null;
    if (recipient.isSettled && recipient.settledWithCaregiverId) {
      const cg = await CareGiver.findByPk(recipient.settledWithCaregiverId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
      });
      if (cg) {
        settledWithCaregiver = {
          id: cg.id,
          firstName: cg.firstName,
          lastName: cg.lastName,
          email: cg.email,
          profileImageUrl: cg.profileImageUrl,
        };
      }
    }

    // Check for pending settlement request
    let pendingSettlementRequest = null;
    if (!recipient.isSettled) {
      const pending = await SettlementRequest.findOne({
        where: { careRecipientId: recipientId, status: 'pending' },
        include: [{
          model: CareGiver,
          as: 'careGiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profileImageUrl'],
        }],
      });
      if (pending) {
        pendingSettlementRequest = {
          id: pending.id,
          status: pending.status,
          createdAt: pending.createdAt,
          caregiver: pending.careGiver ? {
            id: pending.careGiver.id,
            firstName: pending.careGiver.firstName,
            lastName: pending.careGiver.lastName,
            email: pending.careGiver.email,
            profileImageUrl: pending.careGiver.profileImageUrl,
          } : null,
        };
      }
    }
    
    return successResponse(res, {
      profile: {
        id: recipient.id,
        email: recipient.email,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        phone: recipient.phone,
        dateOfBirth: recipient.dateOfBirth,
        address: recipient.address,
        city: recipient.city,
        postalCode: recipient.postalCode,
        country: recipient.country,
        bio: recipient.bio,
        careNeeds: resolveSkills(recipient.careNeeds, careNeedsMap),
        profileImageUrl: recipient.profileImageUrl,
        isSettled: recipient.isSettled,
        settledWithCaregiver,
        settledAt: recipient.settledAt,
        pendingSettlementRequest,
        memberSince: recipient.createdAt,
      },
    }, 'Profile retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update the current recipient's profile
 * 
 * SECURITY:
 * - Only authenticated care_recipients can update their own profile
 * - Cannot update email or password through this endpoint
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth',
      'address', 'city', 'postalCode', 'country', 'bio', 
      'careNeeds', 'profileImageUrl'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate: at least 1 care need required
    if (updates.careNeeds !== undefined) {
      const needsArr = Array.isArray(updates.careNeeds) ? updates.careNeeds : [];
      if (needsArr.length === 0) {
        return errorResponse(res, 'At least one care need is required', 400, 'MIN_CARE_NEEDS');
      }
    }
    
    await CareRecipient.update(updates, {
      where: { id: recipientId },
    });
    
    return successResponse(res, null, 'Profile updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update recipient's email
 * 
 * SECURITY:
 * - Requires current password verification
 */
const updateEmail = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { currentPassword, newEmail } = req.body;
    
    if (!currentPassword || !newEmail) {
      return errorResponse(res, 'Current password and new email are required', 400, 'MISSING_FIELDS');
    }
    
    const recipient = await CareRecipient.findByPk(recipientId);
    
    if (!recipient) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isValidPassword = await recipient.validatePassword(currentPassword);
    if (!isValidPassword) {
      return errorResponse(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD');
    }
    
    // Check if email is already in use
    const existingUser = await CareRecipient.findOne({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== recipientId) {
      return errorResponse(res, 'Email is already in use', 400, 'EMAIL_IN_USE');
    }
    
    await CareRecipient.update({ email: newEmail }, { where: { id: recipientId } });
    
    return successResponse(res, null, 'Email updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update recipient's password
 * 
 * SECURITY:
 * - Requires current password verification
 */
const updatePassword = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400, 'MISSING_FIELDS');
    }
    
    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
    }
    
    const recipient = await CareRecipient.findByPk(recipientId);
    
    if (!recipient) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isValidPassword = await recipient.validatePassword(currentPassword);
    if (!isValidPassword) {
      return errorResponse(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD');
    }
    
    // Update password (will be hashed by model hook)
    recipient.password = newPassword;
    await recipient.save();
    
    return successResponse(res, null, 'Password updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Settle with a caregiver (care recipient sends a settlement request)
 * Creates a pending request that the caregiver must confirm.
 * 
 * POST /api/recipient/settle
 * Body: { caregiverEmail: string } OR { caregiverId: number }
 */
const settleWithCaregiver = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { caregiverEmail, caregiverId } = req.body;
    
    if (!caregiverEmail && !caregiverId) {
      return errorResponse(res, 'Caregiver email or ID is required', 400, 'MISSING_FIELDS');
    }
    
    const recipient = await CareRecipient.findByPk(recipientId);
    if (!recipient) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    if (recipient.isSettled) {
      return errorResponse(res, 'You are already settled with a caregiver', 400, 'ALREADY_SETTLED');
    }

    // Check if there's already a pending request from this recipient
    const existingPending = await SettlementRequest.findOne({
      where: { careRecipientId: recipientId, status: 'pending' },
    });
    if (existingPending) {
      return errorResponse(res, 'You already have a pending settlement request', 400, 'REQUEST_PENDING');
    }
    
    // Find the caregiver
    let caregiver;
    if (caregiverId) {
      caregiver = await CareGiver.findOne({ where: { id: caregiverId, isActive: true } });
    } else {
      caregiver = await CareGiver.findOne({ where: { email: caregiverEmail, isActive: true } });
    }
    
    if (!caregiver) {
      return errorResponse(res, 'Caregiver not found', 404, 'CAREGIVER_NOT_FOUND');
    }

    // Create a pending settlement request
    const request = await SettlementRequest.create({
      careRecipientId: recipientId,
      careGiverId: caregiver.id,
      status: 'pending',
    });
    
    return successResponse(res, {
      requestId: request.id,
      caregiverId: caregiver.id,
      caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      status: 'pending',
    }, 'Settlement request sent. Waiting for caregiver confirmation.');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a pending settlement request (care recipient withdraws)
 * 
 * POST /api/recipient/cancel-settlement
 */
const cancelSettlementRequest = async (req, res, next) => {
  try {
    const recipientId = req.user.id;

    const pendingRequest = await SettlementRequest.findOne({
      where: { careRecipientId: recipientId, status: 'pending' },
    });

    if (!pendingRequest) {
      return errorResponse(res, 'No pending settlement request found', 404, 'NO_PENDING_REQUEST');
    }

    await pendingRequest.destroy();

    return successResponse(res, null, 'Settlement request cancelled');
  } catch (error) {
    next(error);
  }
};

/**
 * Unsettle from caregiver
 * 
 * POST /api/recipient/unsettle
 */
const unsettleFromCaregiver = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    
    const recipient = await CareRecipient.findByPk(recipientId);
    if (!recipient) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    if (!recipient.isSettled) {
      return errorResponse(res, 'You are not currently settled', 400, 'NOT_SETTLED');
    }
    
    await recipient.update({
      isSettled: false,
      settledWithCaregiverId: null,
      settledAt: null,
    });
    
    return successResponse(res, null, 'Successfully unsettled');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findCaregivers,
  getCaregiverProfile,
  getFilterOptions,
  getMyProfile,
  updateMyProfile,
  updateEmail,
  updatePassword,
  settleWithCaregiver,
  unsettleFromCaregiver,
  cancelSettlementRequest,
};
