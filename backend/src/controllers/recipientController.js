const models = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

const { CareGiver, CareNeed, CareRecipient } = models;

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
 * Settle with a caregiver (care recipient marks themselves as settled)
 * Can be triggered from settings page (with caregiver email) or from chat confirmation
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
    
    await recipient.update({
      isSettled: true,
      settledWithCaregiverId: caregiver.id,
      settledAt: new Date(),
    });
    
    return successResponse(res, {
      settledWithCaregiverId: caregiver.id,
      settledWithCaregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
    }, 'You are now settled with this caregiver');
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
};
