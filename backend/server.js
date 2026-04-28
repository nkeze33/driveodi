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

// ======================================================
// RENDER PROXY SETTING
// Required on Render so express-rate-limit can read
// the real client IP correctly.
// ======================================================
app.set("trust proxy", 1);

// ======================================================
// CONNECT TO DATABASE
// ======================================================
connectDB();

// ======================================================
// SECURITY HEADERS
// Helmet adds safe HTTP headers.
// crossOriginResourcePolicy is disabled to avoid blocking
// frontend/backend communication during production use.
// ======================================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ======================================================
// CORS CONFIGURATION
// Controls which frontend domains can access this backend.
// No trailing slashes should be used in origins.
// ======================================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://driveodi.com",
  "https://www.driveodi.com",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without browser origin,
      // such as Stripe webhooks, Postman, curl, and health checks.
      if (!origin) {
        return callback(null, true);
      }

      // Allow only trusted frontend domains.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log blocked domains for debugging in Render logs.
      console.log("Blocked by CORS:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    // Allows cookies/auth headers if needed later.
    credentials: true,
  })
);

// ======================================================
// RATE LIMITING
// Global limiter protects the whole API.
// Auth limiter protects login/register/resend routes.
// ======================================================
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

// ======================================================
// STRIPE WEBHOOK RAW BODY
// IMPORTANT:
// This must come BEFORE express.json().
// Stripe needs the raw request body to verify signatures.
// ======================================================
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

// ======================================================
// BODY PARSERS
// Parses normal JSON and form data.
// Small limits reduce abuse.
// ======================================================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ======================================================
// MONGO SANITIZATION
// Protects against MongoDB operator injection.
// Example attack values: $ne, $gt, $where.
// ======================================================
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = mongoSanitize.sanitize(req.params);
  }

  if (req.query && typeof req.query === "object") {
    req.query = mongoSanitize.sanitize(req.query);
  }

  next();
});

// ======================================================
// HTTP PARAMETER POLLUTION PROTECTION
// Prevents duplicated query params from causing issues.
// ======================================================
app.use(hpp());

// ======================================================
// HEALTH CHECK ROUTE
// Useful for testing whether the Render backend is alive.
// ======================================================
app.get("/", (req, res) => {
  res.send("Driveodi API is running...");
});

// ======================================================
// API ROUTES
// ======================================================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/billing", billingRoutes);

// ======================================================
// 404 HANDLER
// Runs when no route matches the request.
// ======================================================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======================================================
// GLOBAL ERROR HANDLER
// Keeps server errors clean and prevents stack traces
// from being exposed to users.
// ======================================================
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

// ======================================================
// START SERVER
// Render provides process.env.PORT.
// Local fallback is 5000.
// ======================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});