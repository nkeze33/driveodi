// ==========================================
// IMPORTS
// ==========================================
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/User");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// HELPERS
// ==========================================

const hasAccessStatus = (status) => {
  return status === "trialing" || status === "active";
};

const checkBillingEnv = () => {
  const requiredEnvVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_MONTHLY_PRICE_ID",
    "CLIENT_URL",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return `Missing billing environment variable(s): ${missing.join(", ")}`;
  }

  return null;
};

const checkWebhookEnv = () => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return "Missing STRIPE_WEBHOOK_SECRET.";
  }

  return null;
};

const buildSubscriptionUpdate = (subscription) => ({
  stripeSubscriptionId: subscription.id,
  subscriptionStatus: subscription.status,
  isSubscriptionActive: hasAccessStatus(subscription.status),

  trialStartDate: subscription.trial_start
    ? new Date(subscription.trial_start * 1000)
    : null,

  trialEndDate: subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null,

  subscriptionCurrentPeriodEnd: subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null,
});

// ==========================================
// CREATE CHECKOUT SESSION
// ==========================================
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const envError = checkBillingEnv();

    if (envError) {
      console.error(envError);
      return res.status(500).json({
        message: "Billing is not configured correctly.",
      });
    }

    const user = await User.findById(req.user._id);

    const startWithTrial =
      req.body.startWithTrial === undefined ? true : req.body.startWithTrial;

    if (typeof startWithTrial !== "boolean") {
      return res.status(400).json({
        message: "Invalid billing request.",
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before starting a subscription.",
      });
    }

    if (user.stripeSubscriptionId && hasAccessStatus(user.subscriptionStatus)) {
      return res.status(400).json({
        message: "You already have an active or trial subscription.",
      });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      customerId = customer.id;

      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      });
    }

    const subscriptionData = {
      metadata: {
        userId: user._id.toString(),
      },
    };

    if (startWithTrial) {
      subscriptionData.trial_period_days = 30;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],

      subscription_data: subscriptionData,

      success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,

      metadata: {
        userId: user._id.toString(),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);

    return res.status(500).json({
      message: "Failed to create checkout session.",
    });
  }
});

// ==========================================
// UPGRADE NOW
// ==========================================
router.post("/upgrade-now", requireAuth, async (req, res) => {
  try {
    const envError = checkBillingEnv();

    if (envError) {
      console.error(envError);
      return res.status(500).json({
        message: "Billing is not configured correctly.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        message: "No subscription found to upgrade.",
      });
    }

    if (user.subscriptionStatus !== "trialing") {
      return res.status(400).json({
        message: "Only trial subscriptions can be upgraded now.",
      });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      trial_end: "now",
      proration_behavior: "none",
    });

    return res.status(200).json({
      message: "Trial ended. Payment is being processed.",
    });
  } catch (error) {
    console.error("Upgrade now error:", error.message);

    return res.status(500).json({
      message: "Failed to upgrade subscription now.",
    });
  }
});

// ==========================================
// CREATE BILLING PORTAL SESSION
// ==========================================
router.post("/create-portal-session", requireAuth, async (req, res) => {
  try {
    const envError = checkBillingEnv();

    if (envError) {
      console.error(envError);
      return res.status(500).json({
        message: "Billing is not configured correctly.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        message: "Stripe customer not found.",
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error.message);

    return res.status(500).json({
      message: "Failed to create portal session.",
    });
  }
});

// ==========================================
// STRIPE WEBHOOK
// ==========================================
router.post("/webhook", async (req, res) => {
  let event;

  try {
    const webhookEnvError = checkWebhookEnv();

    if (webhookEnvError) {
      console.error(webhookEnvError);
      return res.status(500).send("Webhook is not configured correctly.");
    }

    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing Stripe signature.");
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Webhook received:", event.type);
  } catch (error) {
    console.error("Webhook verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (!session.metadata?.userId) {
          console.error("Checkout session missing userId metadata.");
          break;
        }

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );

          const updatedUser = await User.findByIdAndUpdate(
            session.metadata.userId,
            {
              stripeCustomerId: session.customer,
              ...buildSubscriptionUpdate(subscription),
            },
            { new: true }
          );

          console.log("User updated after checkout:", updatedUser);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const userId = subscription.metadata?.userId;

        let updatedUser = null;

        if (userId) {
          updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              stripeCustomerId: subscription.customer,
              ...buildSubscriptionUpdate(subscription),
            },
            { new: true }
          );
        }

        if (!updatedUser) {
          updatedUser = await User.findOneAndUpdate(
            { stripeCustomerId: subscription.customer },
            {
              stripeCustomerId: subscription.customer,
              ...buildSubscriptionUpdate(subscription),
            },
            { new: true }
          );
        }

        console.log("User updated from subscription event:", updatedUser);
        break;
      }

      // ==========================================
      // PAYMENT SUCCESS
      // IMPORTANT:
      // Do NOT blindly set subscriptionStatus to "active".
      // During a trial, Stripe may send invoice.paid for a £0 invoice.
      // We retrieve the real subscription status from Stripe instead.
      // ==========================================
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;

        console.log("Invoice paid for customer:", invoice.customer);

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription
          );

          const updatedUser = await User.findOneAndUpdate(
            { stripeCustomerId: invoice.customer },
            {
              stripeCustomerId: subscription.customer,
              ...buildSubscriptionUpdate(subscription),
            },
            { new: true }
          );

          console.log("User synced after invoice payment:", updatedUser);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        const updatedUser = await User.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          {
            subscriptionStatus: "past_due",
            isSubscriptionActive: false,
          },
          { new: true }
        );

        console.log("Payment failed. Access removed:", updatedUser);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const updatedUser = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            subscriptionStatus: "canceled",
            isSubscriptionActive: false,
            subscriptionCurrentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
          { new: true }
        );

        console.log("Subscription canceled:", updatedUser);
        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error.message);

    return res.status(500).json({
      message: "Webhook handling failed.",
    });
  }
});

module.exports = router;