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

connectDB();

/**
 * -----------------------------------------
 * BASIC SECURITY HEADERS
 * -----------------------------------------
 */
app.use(helmet());

/**
 * -----------------------------------------
 * CORS
 * Only allow your frontend origins
 * -----------------------------------------
 */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://dainty-sunflower-0652fc.netlify.app",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

/**
 * -----------------------------------------
 * RATE LIMITING
 * Basic protection against brute force / abuse
 * -----------------------------------------
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login/register attempts. Please try again later.",
});

app.use(globalLimiter);

/**
 * -----------------------------------------
 * STRIPE WEBHOOK
 * Must stay before express.json()
 * -----------------------------------------
 */
app.use(
  "/api/billing/webhook",
  express.raw({ type: "application/json" })
);

/**
 * -----------------------------------------
 * BODY PARSER
 * -----------------------------------------
 */
app.use(express.json({ limit: "1mb" }));

/**
 * -----------------------------------------
 * SANITIZATION
 * -----------------------------------------
 */
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = mongoSanitize.sanitize(req.params);
  }

  // Do NOT sanitize req.query here, because it can cause
  // "Cannot set property query of #<IncomingMessage>" errors
  next();
});
app.use(hpp());

/**
 * -----------------------------------------
 * HEALTH CHECK
 * -----------------------------------------
 */
app.get("/", (req, res) => {
  res.send("Driving Instructor API is running...");
});

/**
 * -----------------------------------------
 * ROUTES
 * -----------------------------------------
 */
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/billing", billingRoutes);

/**
 * -----------------------------------------
 * 404 HANDLER
 * -----------------------------------------
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/**
 * -----------------------------------------
 * GLOBAL ERROR HANDLER
 * -----------------------------------------
 */
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});