require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const skillRoutes = require("./routes/skillRoutes");
const billingRoutes = require("./routes/billingRoutes");

const app = express();

// Required on Render so rate-limit reads the real client IP correctly.
app.set("trust proxy", 1);

// Connect to MongoDB.
connectDB();

// ==========================================
// SECURITY HEADERS
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ==========================================
// CORS CONFIGURATION
// Only allow your local frontend and live frontend.
// No trailing slashes in origins.
// ==========================================
if (!allowedOrigins.includes(origin)) {
  console.log("Blocked by CORS:", origin);
  return callback(new Error("Not allowed by CORS"));
}

const allowedOrigins = [
  "http://localhost:3000",
  "https://driveodi.com",
  "https://www.driveodi.com",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests such as Stripe, Postman, curl, health checks.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ==========================================
// RATE LIMITING
// Global limiter protects the whole API.
// Auth limiter protects login/register/resend from abuse.
// ==========================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login or registration attempts. Please try again later.",
  },
});

app.use(globalLimiter);

// ==========================================
// STRIPE WEBHOOK RAW BODY
// IMPORTANT:
// This must be BEFORE express.json().
// Stripe signature verification needs the raw request body.
// ==========================================
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

// ==========================================
// BODY PARSERS
// Keep small limits to reduce abuse.
// ==========================================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ==========================================
// MONGO SANITIZATION
// Protects against MongoDB operator injection such as $ne, $gt, etc.
// ==========================================
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = mongoSanitize.sanitize(req.params);
  }

  next();
});

// ==========================================
// HTTP PARAMETER POLLUTION PROTECTION
// Prevents duplicated query params from causing unexpected behaviour.
// ==========================================
app.use(hpp());

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
  res.send("Driving Instructor API is running...");
});

// ==========================================
// ROUTES
// ==========================================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/billing", billingRoutes);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ==========================================
// GLOBAL ERROR HANDLER
// Do not leak stack traces to users.
// ==========================================
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "This origin is not allowed to access the API.",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
});

// ==========================================
// START SERVER
// Render provides process.env.PORT.
// Local fallback is 5000.
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});