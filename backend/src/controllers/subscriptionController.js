const Stripe = require('stripe');
const config = require('../config/config');
const models = require('../models');
const { successResponse, errorResponse, USER_ROLES } = require('../utils/helpers');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * Get or create a Stripe customer for the user
 */
const getOrCreateCustomer = async (user, role) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: {
      userId: String(user.id),
      role,
    },
  });

  await user.update({ stripeCustomerId: customer.id });
  return customer.id;
};

/**
 * Create a Stripe Checkout Session for subscription
 * POST /api/subscription/create-checkout
 * Body: { plan: 'monthly' | 'yearly' }
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const user = req.user;
    const role = req.userRole;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return errorResponse(res, 'Invalid plan. Must be "monthly" or "yearly".', 400, 'INVALID_PLAN');
    }

    const priceId = plan === 'monthly' 
      ? config.stripe.monthlyPriceId 
      : config.stripe.yearlyPriceId;

    const customerId = await getOrCreateCustomer(user, role);

    // Determine the success / cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardPath = role === USER_ROLES.CARE_GIVER ? '/caregiver' : '/dashboard';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/plans`,
      metadata: {
        userId: String(user.id),
        role,
        plan,
      },
    });

    return successResponse(res, { url: session.url, sessionId: session.id }, 'Checkout session created');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Stripe Customer Portal session (manage subscription)
 * POST /api/subscription/portal
 */
const createPortalSession = async (req, res, next) => {
  try {
    const user = req.user;
    const role = req.userRole;

    if (!user.stripeCustomerId) {
      return errorResponse(res, 'No subscription found', 400, 'NO_SUBSCRIPTION');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardPath = role === USER_ROLES.CARE_GIVER ? '/caregiver/settings' : '/dashboard/settings';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}${dashboardPath}`,
    });

    return successResponse(res, { url: session.url }, 'Portal session created');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription status for the logged-in user
 * GET /api/subscription/status
 */
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const role = req.userRole;

    // Check trial expiry for caregivers
    let effectiveStatus = user.subscriptionStatus || 'none';
    if (effectiveStatus === 'trial' && user.trialEndsAt) {
      if (new Date() > new Date(user.trialEndsAt)) {
        effectiveStatus = 'expired';
      }
    }

    // Check if subscription is active but scheduled to cancel
    const isCanceling = effectiveStatus === 'active' && user.subscriptionEndsAt != null;

    // Fetch current_period_end from Stripe for active subscriptions
    let currentPeriodEnd = null;
    let plan = null;
    if (user.subscriptionId && ['active', 'past_due'].includes(effectiveStatus)) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.subscriptionId);
        // In newer Stripe API versions, current_period_end is on the subscription item
        const item = sub.items?.data?.[0];
        const periodEnd = sub.current_period_end || item?.current_period_end;
        if (periodEnd) {
          currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
        }
        // Determine plan from price
        const priceId = item?.price?.id || item?.plan?.id;
        if (priceId === config.stripe.monthlyPriceId) plan = 'monthly';
        else if (priceId === config.stripe.yearlyPriceId) plan = 'yearly';
      } catch {
        // Ignore Stripe errors — return what we have
      }
    }

    return successResponse(res, {
      subscriptionStatus: effectiveStatus,
      subscriptionId: user.subscriptionId || null,
      trialEndsAt: user.trialEndsAt || null,
      subscriptionEndsAt: user.subscriptionEndsAt || null,
      currentPeriodEnd,
      plan,
      isCanceling,
      role,
    }, 'Subscription status retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a checkout session completed (called from frontend success page)
 * POST /api/subscription/verify
 * Body: { sessionId: string }
 */
const verifyCheckout = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const user = req.user;

    if (!sessionId) {
      return errorResponse(res, 'Session ID is required', 400, 'MISSING_SESSION_ID');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      return errorResponse(res, 'Payment not completed', 400, 'PAYMENT_INCOMPLETE');
    }

    // Update user subscription
    const subscription = session.subscription;
    await user.update({
      subscriptionStatus: 'active',
      subscriptionId: typeof subscription === 'string' ? subscription : subscription.id,
      stripeCustomerId: session.customer,
      subscriptionEndsAt: null,
    });

    return successResponse(res, {
      subscriptionStatus: 'active',
    }, 'Subscription activated');
  } catch (error) {
    next(error);
  }
};

/**
 * Stripe Webhook Handler
 * POST /api/subscription/webhook
 * Must use raw body (not parsed JSON)
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (config.stripe.webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } else {
      // In development without webhook secret, parse the body directly
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { CareGiver, CareRecipient } = models;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status; // active, past_due, canceled, etc.

        // Find the user by stripe customer id
        let user = await CareGiver.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) {
          user = await CareRecipient.findOne({ where: { stripeCustomerId: customerId } });
        }

        if (user) {
          const mappedStatus = ['active', 'trialing'].includes(status) ? 'active' : 
                               status === 'past_due' ? 'past_due' : 
                               status === 'canceled' ? 'canceled' : user.subscriptionStatus;

          const updateData = {
            subscriptionStatus: mappedStatus,
            subscriptionId: subscription.id,
          };

          // Handle "cancel at period end" — user canceled but subscription stays
          // active until the current billing period ends
          if (subscription.cancel_at_period_end && ['active', 'trialing'].includes(status)) {
            // User pressed cancel — store when the subscription will actually end
            updateData.subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
            console.log(`📅 Subscription will end on ${updateData.subscriptionEndsAt.toISOString()} for customer ${customerId}`);
          } else if (!subscription.cancel_at_period_end && ['active', 'trialing'].includes(status)) {
            // User re-subscribed or cancellation was reversed — clear the end date
            updateData.subscriptionEndsAt = null;
          }

          await user.update(updateData);
          console.log(`✅ Subscription ${event.type} for customer ${customerId}: ${mappedStatus} (cancel_at_period_end: ${subscription.cancel_at_period_end})`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        let user = await CareGiver.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) {
          user = await CareRecipient.findOne({ where: { stripeCustomerId: customerId } });
        }

        if (user) {
          // The billing period has actually ended — now lock out the user
          await user.update({
            subscriptionStatus: 'canceled',
            subscriptionId: null,
            subscriptionEndsAt: null,
          });
          console.log(`❌ Subscription ended for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        let user = await CareGiver.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) {
          user = await CareRecipient.findOne({ where: { stripeCustomerId: customerId } });
        }

        if (user && user.subscriptionStatus !== 'active') {
          await user.update({ subscriptionStatus: 'active' });
          console.log(`💳 Payment succeeded, subscription active for ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        let user = await CareGiver.findOne({ where: { stripeCustomerId: customerId } });
        if (!user) {
          user = await CareRecipient.findOne({ where: { stripeCustomerId: customerId } });
        }

        if (user) {
          await user.update({ subscriptionStatus: 'past_due' });
          console.log(`⚠️ Payment failed for ${customerId}`);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`❌ Webhook handler error for ${event.type}:`, err);
  }

  res.json({ received: true });
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  verifyCheckout,
  handleWebhook,
};
