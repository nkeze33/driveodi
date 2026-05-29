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
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },

    // Stored as hashed password only
    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["instructor", "admin"],
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
        maxlength: 80,
      },
      country: {
        type: String,
        default: "",
        trim: true,
        maxlength: 80,
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
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // ==================================================
    // STRIPE / SUBSCRIPTION DATA
    // ==================================================
    stripeCustomerId: {
      type: String,
      default: "",
      trim: true,
    },

    stripeSubscriptionId: {
      type: String,
      default: "",
      trim: true,
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
        "expired"
      ],
      default: "trialing",
    },

    subscriptionPlan: {
      type: String,
      enum: ["monthly"],
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
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==================================================
// INDEXES
// Speeds up common lookups and enforces uniqueness
// ==================================================
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model("User", userSchema);