const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // ============================================
    // AUTO EXPIRE TRIALS
    // ============================================
    if (
      user.subscriptionStatus === "trialing" &&
      user.trialEndDate &&
      user.trialEndDate < new Date()
    ) {
      user.subscriptionStatus = "expired";
      user.isSubscriptionActive = false;

      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = requireAuth;