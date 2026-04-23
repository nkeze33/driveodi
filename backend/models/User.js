const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==================================================
    // BASIC USER IDENTITY
    // ==================================================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "instructor",
      trim: true,
    },

    // ==================================================
    // USER LOCATION
    // ==================================================
    location: {
      city: {
        type: String,
        default: "",
        trim: true,
      },
      country: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // ==================================================
    // TERMS ACCEPTANCE
    // ==================================================
    agreedToTerms: {
      type: Boolean,
      default: false,
    },

    agreedToTermsAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // EMAIL VERIFICATION
    // ==================================================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: "",
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // ==================================================
    // STRIPE / SUBSCRIPTION DATA
    // ==================================================
    stripeCustomerId: {
      type: String,
      default: "",
    },

    stripeSubscriptionId: {
      type: String,
      default: "",
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "inactive",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
      default: "inactive",
    },

    subscriptionPlan: {
      type: String,
      default: "monthly",
    },

    trialStartDate: {
      type: Date,
      default: null,
    },

    trialEndDate: {
      type: Date,
      default: null,
    },

    subscriptionCurrentPeriodEnd: {
      type: Date,
      default: null,
    },

    isSubscriptionActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);