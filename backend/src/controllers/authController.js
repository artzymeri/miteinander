const models = require('../models');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse, USER_ROLES, getModelByRole } = require('../utils/helpers');
const { generateVerificationCode, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

const { CareNeed } = models;

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, ...additionalData } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return errorResponse(res, 'Missing required fields: email, password, firstName, lastName, role', 400, 'MISSING_FIELDS');
    }
    
    // Validate role
    const validRoles = [USER_ROLES.CARE_GIVER, USER_ROLES.CARE_RECIPIENT];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 'Invalid role. Must be care_giver or care_recipient', 400, 'INVALID_ROLE');
    }
    
    // Get the appropriate model
    const Model = getModelByRole(role, models);
    
    if (!Model) {
      return errorResponse(res, 'Invalid user type', 400, 'INVALID_USER_TYPE');
    }
    
    // Check if email already exists across ALL user tables
    const { Admin, Support, CareGiver, CareRecipient } = models;
    const allTables = [
      { model: Admin, name: 'admin' },
      { model: Support, name: 'support' },
      { model: CareGiver, name: 'care_giver' },
      { model: CareRecipient, name: 'care_recipient' },
    ];
    
    for (const { model } of allTables) {
      const existingByEmail = await model.findOne({ where: { email } });
      if (existingByEmail) {
        return errorResponse(res, 'Email already registered', 409, 'EMAIL_EXISTS');
      }
    }
    
    // Check if phone already exists across ALL user tables (if phone provided)
    const phone = additionalData.phone;
    if (phone) {
      for (const { model } of allTables) {
        const existingByPhone = await model.findOne({ where: { phone } });
        if (existingByPhone) {
          return errorResponse(res, 'Phone number already registered', 409, 'PHONE_EXISTS');
        }
      }
    }
    
    // Validate role-specific required fields
    if (role === USER_ROLES.CARE_GIVER) {
      const skills = additionalData.skills;
      if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return errorResponse(res, 'At least one skill is required', 400, 'MIN_SKILLS');
      }
    }
    if (role === USER_ROLES.CARE_RECIPIENT) {
      const careNeeds = additionalData.careNeeds;
      if (!careNeeds || !Array.isArray(careNeeds) || careNeeds.length === 0) {
        return errorResponse(res, 'At least one care need is required', 400, 'MIN_CARE_NEEDS');
      }
    }

    // Create user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      ...additionalData,
    };

    // Set trial for caregivers: 7-day free trial
    if (role === USER_ROLES.CARE_GIVER) {
      userData.subscriptionStatus = 'trial';
      userData.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    // Care recipients have no trial — status defaults to 'none' (must choose plan)
    if (role === USER_ROLES.CARE_RECIPIENT) {
      userData.subscriptionStatus = 'none';
    }

    const user = await Model.create(userData);
    
    // Generate and send email verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await user.update({
      verificationCode,
      verificationCodeExpiresAt: expiresAt,
    });
    
    // Send verification email (don't block registration on email failure)
    sendVerificationEmail(email, firstName, verificationCode).catch(err => {
      console.error('Failed to send verification email:', err);
    });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
    });
    
    return successResponse(res, {
      user: user.toJSON(),
      token,
      role,
      emailVerificationRequired: true,
    }, 'Registration successful. Please verify your email.', 201);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with code
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return errorResponse(res, 'Email and verification code are required', 400, 'MISSING_FIELDS');
    }
    
    const { Admin, Support, CareGiver, CareRecipient } = models;
    
    const userTables = [
      { model: CareGiver, role: USER_ROLES.CARE_GIVER },
      { model: CareRecipient, role: USER_ROLES.CARE_RECIPIENT },
    ];
    
    let foundUser = null;
    let userRole = null;
    
    for (const { model, role } of userTables) {
      const user = await model.findOne({ where: { email } });
      if (user) {
        foundUser = user;
        userRole = role;
        break;
      }
    }
    
    if (!foundUser) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    
    if (foundUser.emailVerified) {
      return successResponse(res, { alreadyVerified: true }, 'Email already verified');
    }
    
    if (!foundUser.verificationCode || foundUser.verificationCode !== code) {
      return errorResponse(res, 'Invalid verification code', 400, 'INVALID_CODE');
    }
    
    if (new Date() > new Date(foundUser.verificationCodeExpiresAt)) {
      return errorResponse(res, 'Verification code has expired', 400, 'CODE_EXPIRED');
    }
    
    await foundUser.update({
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(foundUser.email, foundUser.firstName).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    const token = generateToken({
      id: foundUser.id,
      email: foundUser.email,
      role: userRole,
    });
    
    return successResponse(res, {
      user: foundUser.toJSON(),
      token,
      role: userRole,
      subscriptionStatus: foundUser.subscriptionStatus || 'none',
      trialEndsAt: foundUser.trialEndsAt || null,
      subscriptionEndsAt: foundUser.subscriptionEndsAt || null,
    }, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification code
 */
const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, 'Email is required', 400, 'MISSING_FIELDS');
    }
    
    const { CareGiver, CareRecipient } = models;
    
    const userTables = [
      { model: CareGiver, role: USER_ROLES.CARE_GIVER },
      { model: CareRecipient, role: USER_ROLES.CARE_RECIPIENT },
    ];
    
    let foundUser = null;
    
    for (const { model } of userTables) {
      const user = await model.findOne({ where: { email } });
      if (user) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      // Don't reveal if user exists
      return successResponse(res, null, 'If the email exists, a new code has been sent');
    }
    
    if (foundUser.emailVerified) {
      return successResponse(res, { alreadyVerified: true }, 'Email already verified');
    }
    
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await foundUser.update({
      verificationCode,
      verificationCodeExpiresAt: expiresAt,
    });
    
    await sendVerificationEmail(email, foundUser.firstName, verificationCode);
    
    return successResponse(res, null, 'Verification code sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * Checks all user tables (Admin, Support, CareGiver, CareRecipient) to find the user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return errorResponse(res, 'Missing required fields: email, password', 400, 'MISSING_FIELDS');
    }
    
    const { Admin, Support, CareGiver, CareRecipient } = models;
    
    // Define the tables to check in order of priority
    const userTables = [
      { model: Admin, role: USER_ROLES.ADMIN },
      { model: Support, role: USER_ROLES.SUPPORT },
      { model: CareGiver, role: USER_ROLES.CARE_GIVER },
      { model: CareRecipient, role: USER_ROLES.CARE_RECIPIENT },
    ];
    
    let foundUser = null;
    let userRole = null;
    
    // Check each table for the user
    for (const { model, role } of userTables) {
      const user = await model.findOne({ where: { email } });
      if (user) {
        foundUser = user;
        userRole = role;
        break;
      }
    }
    
    if (!foundUser) {
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Check if account is active
    if (!foundUser.isActive) {
      return errorResponse(res, 'Account is deactivated', 401, 'ACCOUNT_INACTIVE');
    }
    
    // Validate password
    const isValidPassword = await foundUser.validatePassword(password);
    
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    // Check email verification for care_giver and care_recipient
    if ((userRole === USER_ROLES.CARE_GIVER || userRole === USER_ROLES.CARE_RECIPIENT) && !foundUser.emailVerified) {
      // Resend a new code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await foundUser.update({
        verificationCode,
        verificationCodeExpiresAt: expiresAt,
      });
      sendVerificationEmail(foundUser.email, foundUser.firstName, verificationCode).catch(err => {
        console.error('Failed to send verification email:', err);
      });
      
      return errorResponse(res, 'Email not verified. A new verification code has been sent.', 403, 'EMAIL_NOT_VERIFIED');
    }
    
    // Update last login
    await foundUser.update({ lastLoginAt: new Date() });
    
    // Generate token
    const token = generateToken({
      id: foundUser.id,
      email: foundUser.email,
      role: userRole,
    });

    // Check subscription status for care_giver and care_recipient
    if (userRole === USER_ROLES.CARE_GIVER || userRole === USER_ROLES.CARE_RECIPIENT) {
      let subStatus = foundUser.subscriptionStatus || 'none';

      // For caregivers on trial, check if trial expired
      if (subStatus === 'trial' && foundUser.trialEndsAt) {
        if (new Date() > new Date(foundUser.trialEndsAt)) {
          subStatus = 'expired';
        }
      }

      // If subscription is not active AND (trial expired or care_recipient with 'none'),
      // return SUBSCRIPTION_REQUIRED so frontend redirects to plans page
      if (subStatus === 'expired' || subStatus === 'canceled' || 
          (subStatus === 'none' && userRole === USER_ROLES.CARE_RECIPIENT)) {
        return successResponse(res, {
          user: foundUser.toJSON(),
          token,
          role: userRole,
          subscriptionStatus: subStatus,
          trialEndsAt: foundUser.trialEndsAt || null,
          subscriptionEndsAt: foundUser.subscriptionEndsAt || null,
          subscriptionRequired: true,
        }, 'Login successful — subscription required');
      }

      // Otherwise return normal login with subscription info
      return successResponse(res, {
        user: foundUser.toJSON(),
        token,
        role: userRole,
        subscriptionStatus: subStatus,
        trialEndsAt: foundUser.trialEndsAt || null,
        subscriptionEndsAt: foundUser.subscriptionEndsAt || null,
      }, 'Login successful');
    }
    
    return successResponse(res, {
      user: foundUser.toJSON(),
      token,
      role: userRole,
    }, 'Login successful');
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    return successResponse(res, {
      user: req.user.toJSON(),
      role: req.userRole,
    }, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'postalCode'];
    const updates = {};
    
    // Only allow specific fields to be updated
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    await req.user.update(updates);
    
    return successResponse(res, {
      user: req.user.toJSON(),
    }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400, 'MISSING_FIELDS');
    }
    
    // Validate current password
    const isValid = await req.user.validatePassword(currentPassword);
    
    if (!isValid) {
      return errorResponse(res, 'Current password is incorrect', 401, 'INVALID_PASSWORD');
    }
    
    // Update password
    await req.user.update({ password: newPassword });
    
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active care needs (public endpoint)
 */
const getCareNeeds = async (req, res, next) => {
  try {
    const careNeeds = await CareNeed.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });
    
    return successResponse(res, careNeeds, 'Care needs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password — send reset code to email
 * POST /api/auth/forgot-password
 * Body: { email: string }
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400, 'MISSING_FIELDS');
    }

    const { Admin, Support, CareGiver, CareRecipient } = models;

    const userTables = [
      { model: Admin, role: USER_ROLES.ADMIN },
      { model: Support, role: USER_ROLES.SUPPORT },
      { model: CareGiver, role: USER_ROLES.CARE_GIVER },
      { model: CareRecipient, role: USER_ROLES.CARE_RECIPIENT },
    ];

    let foundUser = null;

    for (const { model } of userTables) {
      const user = await model.findOne({ where: { email } });
      if (user) {
        foundUser = user;
        break;
      }
    }

    // Always return success to prevent email enumeration
    if (!foundUser) {
      return successResponse(res, null, 'If the email exists, a reset code has been sent');
    }

    // Generate code and save
    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await foundUser.update({
      resetPasswordCode: resetCode,
      resetPasswordCodeExpiresAt: expiresAt,
    });

    // Send email (non-blocking for the response, but we await to ensure it's sent)
    sendPasswordResetEmail(email, foundUser.firstName, resetCode).catch(err => {
      console.error('Failed to send password reset email:', err);
    });

    return successResponse(res, null, 'If the email exists, a reset code has been sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with code
 * POST /api/auth/reset-password
 * Body: { email: string, code: string, newPassword: string }
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return errorResponse(res, 'Email, code, and new password are required', 400, 'MISSING_FIELDS');
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
    }

    const { Admin, Support, CareGiver, CareRecipient } = models;

    const userTables = [
      { model: Admin, role: USER_ROLES.ADMIN },
      { model: Support, role: USER_ROLES.SUPPORT },
      { model: CareGiver, role: USER_ROLES.CARE_GIVER },
      { model: CareRecipient, role: USER_ROLES.CARE_RECIPIENT },
    ];

    let foundUser = null;

    for (const { model } of userTables) {
      const user = await model.findOne({ where: { email } });
      if (user) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return errorResponse(res, 'Invalid email or code', 400, 'INVALID_CODE');
    }

    if (!foundUser.resetPasswordCode || foundUser.resetPasswordCode !== code) {
      return errorResponse(res, 'Invalid reset code', 400, 'INVALID_CODE');
    }

    if (new Date() > new Date(foundUser.resetPasswordCodeExpiresAt)) {
      return errorResponse(res, 'Reset code has expired', 400, 'CODE_EXPIRED');
    }

    // Update password and clear reset fields
    await foundUser.update({
      password: newPassword,
      resetPasswordCode: null,
      resetPasswordCodeExpiresAt: null,
    });

    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getCareNeeds,
  forgotPassword,
  resetPassword,
};
