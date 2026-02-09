const models = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

const { CareRecipient, CareNeed } = models;

/**
 * Helper to resolve care need IDs to their full data
 * @param {number[]} ids - Array of care need IDs
 * @param {Object} careNeedsMap - Map of care need ID to care need data
 * @returns {Object[]} - Array of resolved care need objects with id, key, and labels
 */
const resolveCareNeeds = (ids, careNeedsMap) => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => careNeedsMap[id])
    .filter(Boolean);
};

/**
 * Get paginated care recipients (clients) for caregivers to browse
 * Implements infinite scroll with limit/offset pagination
 * 
 * SECURITY: 
 * - Only authenticated care_givers can access
 * - No sensitive data exposed (password, etc.)
 * - Input validation on all query params
 * 
 * NOTE: careNeeds is stored as JSON array of IDs (integers), not text
 * We resolve these IDs to their labels dynamically from the care_needs table
 */
const findClients = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 25)); // Max 50, default 25
    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const whereClause = {
      isActive: true, // Only show active users
      isSettled: false, // Exclude settled care recipients
    };
    
    // Search by postal code or address
    const search = req.query.search?.trim();
    if (search) {
      whereClause[Op.or] = [
        { postalCode: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
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
    
    // Filter by care needs (expertise required)
    // careNeeds is stored as JSON array of IDs
    if (req.query.careNeeds) {
      const careNeedsFilter = Array.isArray(req.query.careNeeds) 
        ? req.query.careNeeds.map(id => parseInt(id)).filter(id => !isNaN(id))
        : [parseInt(req.query.careNeeds)].filter(id => !isNaN(id));
      
      // For JSON array field, we need to check if any of the requested care need IDs are present
      if (careNeedsFilter.length > 0) {
        const careNeedConditions = careNeedsFilter.map(id => 
          models.sequelize.literal(`JSON_CONTAINS(care_needs, '${id}')`)
        );
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push({
          [Op.or]: careNeedConditions
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
    
    // Fetch care recipients with pagination
    const { count, rows: clients } = await CareRecipient.findAndCountAll({
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
        'careNeeds',
        'profileImageUrl',
        'createdAt',
        // Explicitly exclude sensitive fields
        // 'email', 'password', 'phone', 'address', etc. are NOT included
      ],
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return successResponse(res, {
      clients: clients.map(client => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName?.charAt(0) + '.', // Only show initial for privacy
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        careNeeds: resolveCareNeeds(client.careNeeds, careNeedsMap),
        profileImageUrl: client.profileImageUrl,
        createdAt: client.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count,
        limit,
        hasMore,
      },
    }, 'Clients retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single care recipient's public profile
 * 
 * SECURITY:
 * - Only authenticated care_givers can access
 * - Limited data exposure - no sensitive info
 */
const getClientProfile = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id);
    
    if (isNaN(clientId)) {
      return errorResponse(res, 'Invalid client ID', 400, 'INVALID_ID');
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
    
    const client = await CareRecipient.findOne({
      where: {
        id: clientId,
        isActive: true,
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'city',
        'postalCode',
        'country',
        'careNeeds',
        'bio',
        'profileImageUrl',
        'createdAt',
        'isSettled',
        'settledWithCaregiverId',
        // But still exclude: email, password, phone, exact address, emergency contact
      ],
    });
    
    if (!client) {
      return errorResponse(res, 'Client not found', 404, 'CLIENT_NOT_FOUND');
    }
    
    // If client is settled and not with this caregiver, deny access
    if (client.isSettled && client.settledWithCaregiverId !== req.user.id) {
      return errorResponse(res, 'Client not found', 404, 'CLIENT_NOT_FOUND');
    }
    
    return successResponse(res, {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName?.charAt(0) + '.', // Privacy: only initial
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        careNeeds: resolveCareNeeds(client.careNeeds, careNeedsMap),
        bio: client.bio,
        profileImageUrl: client.profileImageUrl,
        memberSince: client.createdAt,
      },
    }, 'Client profile retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get available filter options (countries, cities, care needs)
 */
const getFilterOptions = async (req, res, next) => {
  try {
    // Get distinct countries
    const countries = await CareRecipient.findAll({
      attributes: [[models.sequelize.fn('DISTINCT', models.sequelize.col('country')), 'country']],
      where: { isActive: true, country: { [Op.ne]: null } },
      raw: true,
    });
    
    // Get distinct cities (optionally filtered by country)
    const cityWhere = { isActive: true, city: { [Op.ne]: null } };
    if (req.query.country) {
      cityWhere.country = req.query.country;
    }
    
    const cities = await CareRecipient.findAll({
      attributes: [[models.sequelize.fn('DISTINCT', models.sequelize.col('city')), 'city']],
      where: cityWhere,
      raw: true,
    });
    
    // Get all care needs from config
    const careNeeds = await CareNeed.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });
    
    return successResponse(res, {
      countries: countries.map(c => c.country).filter(Boolean).sort(),
      cities: cities.map(c => c.city).filter(Boolean).sort(),
      careNeeds: careNeeds.map(cn => ({
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
 * Get the current caregiver's own profile
 * 
 * SECURITY:
 * - Only authenticated care_givers can access their own profile
 * - Returns full profile data (not public view)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    
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
    
    const { CareGiver } = models;
    const caregiver = await CareGiver.findByPk(caregiverId, {
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
        'bio',
        'skills',
        'certifications',
        'experienceYears',
        'occupation',
        'profileImageUrl',
        'createdAt',
      ],
    });
    
    if (!caregiver) {
      return errorResponse(res, 'Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    
    // Safely parse certifications
    let certifications = [];
    if (caregiver.certifications) {
      try {
        certifications = JSON.parse(caregiver.certifications);
      } catch {
        // If not valid JSON, treat as single item or empty
        certifications = caregiver.certifications ? [caregiver.certifications] : [];
      }
    }
    
    return successResponse(res, {
      profile: {
        id: caregiver.id,
        email: caregiver.email,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        phone: caregiver.phone,
        dateOfBirth: caregiver.dateOfBirth,
        address: caregiver.address,
        city: caregiver.city,
        postalCode: caregiver.postalCode,
        bio: caregiver.bio,
        skills: resolveCareNeeds(caregiver.skills, careNeedsMap),
        certifications,
        experienceYears: caregiver.experienceYears,
        occupation: caregiver.occupation,
        profileImageUrl: caregiver.profileImageUrl,
        memberSince: caregiver.createdAt,
      },
    }, 'Profile retrieved successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update the current caregiver's profile
 * 
 * SECURITY:
 * - Only authenticated care_givers can update their own profile
 * - Cannot update email or password through this endpoint
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    const { CareGiver } = models;
    
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth',
      'address', 'city', 'postalCode', 'bio', 'skills',
      'experienceYears', 'occupation', 'profileImageUrl', 'certifications'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    await CareGiver.update(updates, {
      where: { id: caregiverId },
    });
    
    return successResponse(res, null, 'Profile updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update caregiver's email
 * 
 * SECURITY:
 * - Requires current password verification
 */
const updateEmail = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    const { currentPassword, newEmail } = req.body;
    
    if (!currentPassword || !newEmail) {
      return errorResponse(res, 'Current password and new email are required', 400, 'MISSING_FIELDS');
    }
    
    const { CareGiver } = models;
    const caregiver = await CareGiver.findByPk(caregiverId);
    
    if (!caregiver) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isValidPassword = await caregiver.validatePassword(currentPassword);
    if (!isValidPassword) {
      return errorResponse(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD');
    }
    
    // Check if email is already in use
    const existingUser = await CareGiver.findOne({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== caregiverId) {
      return errorResponse(res, 'Email is already in use', 400, 'EMAIL_IN_USE');
    }
    
    await CareGiver.update({ email: newEmail }, { where: { id: caregiverId } });
    
    return successResponse(res, null, 'Email updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Update caregiver's password
 * 
 * SECURITY:
 * - Requires current password verification
 */
const updatePassword = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400, 'MISSING_FIELDS');
    }
    
    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
    }
    
    const { CareGiver } = models;
    const caregiver = await CareGiver.findByPk(caregiverId);
    
    if (!caregiver) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isValidPassword = await caregiver.validatePassword(currentPassword);
    if (!isValidPassword) {
      return errorResponse(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD');
    }
    
    // Update password (will be hashed by model hook)
    caregiver.password = newPassword;
    await caregiver.save();
    
    return successResponse(res, null, 'Password updated successfully');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get care recipients settled with this caregiver ("My Clients")
 */
const getMySettledClients = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    
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
    
    const settledClients = await CareRecipient.findAll({
      where: {
        isSettled: true,
        settledWithCaregiverId: caregiverId,
        isActive: true,
      },
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone',
        'city', 'postalCode', 'country', 'careNeeds',
        'bio', 'profileImageUrl', 'settledAt', 'createdAt',
      ],
      order: [['settledAt', 'DESC']],
    });
    
    return successResponse(res, {
      clients: settledClients.map(client => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        careNeeds: resolveCareNeeds(client.careNeeds, careNeedsMap),
        bio: client.bio,
        profileImageUrl: client.profileImageUrl,
        settledAt: client.settledAt,
        memberSince: client.createdAt,
      })),
    }, 'Settled clients retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a settled client's full profile (caregiver can see full details)
 */
const getSettledClientProfile = async (req, res, next) => {
  try {
    const caregiverId = req.user.id;
    const clientId = parseInt(req.params.id);
    
    if (isNaN(clientId)) {
      return errorResponse(res, 'Invalid client ID', 400, 'INVALID_ID');
    }
    
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
    
    const client = await CareRecipient.findOne({
      where: {
        id: clientId,
        isSettled: true,
        settledWithCaregiverId: caregiverId,
        isActive: true,
      },
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone',
        'dateOfBirth', 'address', 'city', 'postalCode', 'country',
        'careNeeds', 'bio', 'emergencyContactName', 'emergencyContactPhone',
        'profileImageUrl', 'settledAt', 'createdAt',
      ],
    });
    
    if (!client) {
      return errorResponse(res, 'Client not found', 404, 'CLIENT_NOT_FOUND');
    }
    
    return successResponse(res, {
      client: {
        ...client.toJSON(),
        careNeeds: resolveCareNeeds(client.careNeeds, careNeedsMap),
        memberSince: client.createdAt,
      },
    }, 'Client profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findClients,
  getClientProfile,
  getFilterOptions,
  getMyProfile,
  updateMyProfile,
  updateEmail,
  updatePassword,
  getMySettledClients,
  getSettledClientProfile,
};
