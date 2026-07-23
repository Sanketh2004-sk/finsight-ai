// ============================================================
// middleware/errorHandler.js — Global Error Handler
// Catches all errors thrown in controllers/services
// ============================================================

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose Errors ──────────────────────────────────────
  // Duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409; // Conflict
  }

  // Mongoose validation error (e.g. required field missing)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(". ");
    statusCode = 400;
  }

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // JWT Errors (handled in middleware but just in case)
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // Log full error in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Show stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
