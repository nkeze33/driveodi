const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const router = express.Router();

const User = require("../models/User");
const requireAuth = require("../middleware/authMiddleware");
const { sendVerificationEmail } = require("../utils/sendEmail");

// ======================================================
// VALIDATION / CLEANING HELPERS
// ======================================================

// Removes risky angle brackets from text input.
// This helps reduce stored script injection attempts.
const sanitizeText = (value) => {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
};

// Basic email format validation.
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Password rule:
// - at least 8 characters
// - uppercase
// - lowercase
// - number
// - special character
const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
    password
  );
};

// Generates a random email verification token.
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Only sends safe user data to the frontend.
// Never send password or verification token fields.
const buildSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  city: user.location?.city || "",
  country: user.location?.country || "",
  isEmailVerified: user.isEmailVerified || false,
  subscriptionStatus: user.subscriptionStatus || "inactive",
  isSubscriptionActive: user.isSubscriptionActive || false,
  trialEndDate: user.trialEndDate || null,
});

// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================
router.post("/register", async (req, res) => {
  try {
    // Clean incoming registration fields.
    const name = sanitizeText(req.body.name);
    const email = sanitizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const city = sanitizeText(req.body.city);
    const country = sanitizeText(req.body.country);
    const agreedToTerms = req.body.agreedToTerms;

    // Required fields.
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    // Name length validation.
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        message: "Name must be between 2 and 80 characters.",
      });
    }

    // Email length + format validation.
    if (email.length > 120 || !isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    // Password length guard.
    // Prevents extremely large payload abuse.
    if (password.length > 128) {
      return res.status(400).json({
        message: "Password is too long.",
      });
    }

    // Strong password validation.
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    // Optional location length validation.
    if (city.length > 80) {
      return res.status(400).json({
        message: "City cannot be more than 80 characters.",
      });
    }

    if (country.length > 80) {
      return res.status(400).json({
        message: "Country cannot be more than 80 characters.",
      });
    }

    // Terms must be explicitly accepted.
    if (agreedToTerms !== true) {
      return res.status(400).json({
        message: "You must agree to the Terms of Use and Privacy Policy.",
      });
    }

    // Prevent duplicate accounts.
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message:       "An account with this email already exists. Please log in.",

      });
    }

    // Hash password before saving.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create email verification token.
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Prepare new user.
    const user = new User({
      name,
      email,
      password: hashedPassword,
      location: {
        city,
        country,
      },
      agreedToTerms: true,
      agreedToTermsAt: new Date(),

      // Email verification fields.
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,

      // Subscription defaults.
      subscriptionStatus: "inactive",
      isSubscriptionActive: false,
      trialStartDate: null,
      trialEndDate: null,
      stripeCustomerId: "",
      stripeSubscriptionId: "",
    });

    // Save user first, then attempt to send email.
    // If email fails, we roll back the user creation.
    const savedUser = await user.save();

    try {
      await sendVerificationEmail({
        to: savedUser.email,
        name: savedUser.name,
        token: verificationToken,
      });
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);

      // Roll back user if verification email cannot be sent.
      await User.findByIdAndDelete(savedUser._id);

      return res.status(500).json({
        message:
          "Registration failed because the verification email could not be sent. Please try again later.",
      });
    }

    return res.status(201).json({
      message:
        "Registration successful. Please check your email and verify your account before logging in.",
    });
  } catch (error) {
    console.error("Register error:", error.message);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});

// ======================================================
// VERIFY EMAIL
// GET /api/auth/verify-email?token=...
// ======================================================
router.get("/verify-email", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return res.status(400).json({
        message: "Verification token is missing.",
      });
    }

    // Token should match an unexpired record.
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token.",
      });
    }

    // Mark user as verified and remove token.
    user.isEmailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Verify email error:", error.message);

    return res.status(500).json({
      message: "Email verification failed.",
    });
  }
});

// ======================================================
// RESEND VERIFICATION
// POST /api/auth/resend-verification
// ======================================================
router.post("/resend-verification", async (req, res) => {
  try {
    const email = sanitizeText(req.body.email).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

  const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "No account found with that email.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email is already verified.",
      });
    }

    const newToken = generateVerificationToken();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = newExpiry;

    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: newToken,
      });
    } catch (emailError) {
      console.error("Resend verification email failed:", emailError.message);

      return res.status(500).json({
        message:
          "Could not resend verification email. Please try again later.",
      });
    }

    return res.status(200).json({
      message: "Verification email sent again. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      message: "Could not resend verification email.",
    });
  }
});

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================
router.post("/login", async (req, res) => {
  try {
    const email = sanitizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    // Keep login errors generic to avoid revealing account details.
    if (!email || !password || !isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const storedPassword = user.password || user.passwordHash;

    if (!storedPassword) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const passwordMatches = await bcrypt.compare(password, storedPassword);

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. If you did not receive the email, request a new verification link.",
      });
    }

    // Sign short user identity into JWT.
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -passwordHash -emailVerificationToken"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(buildSafeUser(user));
  } catch (error) {
    console.error("GET /me error:", error.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;