const models = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

const { Review, CareGiver, CareRecipient } = models;

/**
 * Submit a review for a caregiver
 * POST /api/recipient/reviews
 * Body: { caregiverId: number, rating: number (1-5), comment?: string }
 * 
 * Rules:
 * - Must be settled with the caregiver
 * - Must be settled for at least 1 day
 * - Can only review once per caregiver
 */
const submitReview = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const { caregiverId, rating, comment } = req.body;

    if (!caregiverId || !rating) {
      return errorResponse(res, 'caregiverId and rating are required', 400);
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return errorResponse(res, 'Rating must be an integer between 1 and 5', 400);
    }

    // Verify recipient is settled with this caregiver
    const recipient = await CareRecipient.findByPk(recipientId);
    if (!recipient || !recipient.isSettled || recipient.settledWithCaregiverId !== caregiverId) {
      return errorResponse(res, 'You must be settled with this caregiver to leave a review', 403);
    }

    // Check settled for at least 1 day
    if (recipient.settledAt) {
      const settledDate = new Date(recipient.settledAt);
      const oneDayLater = new Date(settledDate.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() < oneDayLater) {
        return errorResponse(res, 'You can rate your caregiver after 24 hours of settling', 403);
      }
    }

    // Check for existing review
    const existing = await Review.findOne({
      where: { careRecipientId: recipientId, careGiverId: caregiverId },
    });
    if (existing) {
      return errorResponse(res, 'You have already reviewed this caregiver', 409);
    }

    // Create review
    const review = await Review.create({
      careRecipientId: recipientId,
      careGiverId: caregiverId,
      rating,
      comment: comment?.trim() || null,
    });

    // Update caregiver's average rating and review count
    const allReviews = await Review.findAll({
      where: { careGiverId: caregiverId },
      attributes: ['rating'],
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;

    await CareGiver.update(
      { rating: avgRating.toFixed(2), reviewCount: allReviews.length },
      { where: { id: caregiverId } }
    );

    return successResponse(res, { review }, 'Review submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a caregiver
 * GET /api/recipient/reviews/:caregiverId
 */
const getCaregiverReviews = async (req, res, next) => {
  try {
    const caregiverId = parseInt(req.params.caregiverId);

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
    next(error);
  }
};

/**
 * Check if current user has already reviewed a caregiver
 * GET /api/recipient/reviews/:caregiverId/check
 */
const checkReview = async (req, res, next) => {
  try {
    const recipientId = req.user.id;
    const caregiverId = parseInt(req.params.caregiverId);

    const existing = await Review.findOne({
      where: { careRecipientId: recipientId, careGiverId: caregiverId },
    });

    return successResponse(res, { hasReviewed: !!existing, review: existing });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReview,
  getCaregiverReviews,
  checkReview,
};
