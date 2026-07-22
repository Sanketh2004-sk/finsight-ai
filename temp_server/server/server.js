// ============================================================
// server.js — Main Entry Point for AiXpense Backend
// Sets up Express, middleware, routes, and DB connection
// ============================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// ──────────────────────────────────────────────────────────
// 1. Connect to MongoDB
// ──────────────────────────────────────────────────────────
connectDB();

// ──────────────────────────────────────────────────────────
// 2. Security Middleware
// ──────────────────────────────────────────────────────────
// Helmet sets secure HTTP headers (prevents XSS, clickjacking, etc.)
app.use(helmet());

// CORS — only allow our frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allow cookies / auth headers
  })
);

// Rate Limiting — prevent brute-force and DoS attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", limiter);

// ──────────────────────────────────────────────────────────
// 3. Body Parsers
// ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" })); // parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // parse form data

// ──────────────────────────────────────────────────────────
// 4. Request Logger (only in development)
// ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ──────────────────────────────────────────────────────────
// 5. API Routes
// ──────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/incomes", require("./routes/incomeRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/goals", require("./routes/goalRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ──────────────────────────────────────────────────────────
// 6. Health Check Route
// ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AiXpense API is running 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ──────────────────────────────────────────────────────────
// 7. 404 Handler (route not found)
// ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ──────────────────────────────────────────────────────────
// 8. Global Error Handler
// ──────────────────────────────────────────────────────────
app.use(require("./middleware/errorHandler"));

// ──────────────────────────────────────────────────────────
// 9. Start Server + Background Jobs
// ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 AiXpense Server running on port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api\n`);

  // Start cron jobs after server is running
  require("./cron/cronJobs");
});

module.exports = app; // export for testing with Jest/Supertest
