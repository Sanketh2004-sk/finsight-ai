// ============================================================
// middleware/authMiddleware.js — JWT Authentication Guard
// Protects routes by verifying the JWT token
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — Middleware to verify JWT and attach user to req
 *
 * How JWT works:
 * 1. User logs in → server creates a token with user._id as payload
 * 2. Client stores token and sends it in the Authorization header
 * 3. This middleware verifies the token signature using JWT_SECRET
 * 4. If valid, it attaches the user document to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists with Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    // Extract token: "Bearer <token>" → "<token>"
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    // Verify the token using our secret key
    // If tampered with or expired, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB (excluding password)
    // This also ensures the user still exists (not deleted)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token is invalid.",
      });
    }

    next(); // proceed to the actual route handler
  } catch (error) {
    // Handle specific JWT errors
    let message = "Token is invalid or expired.";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired. Please log in again.";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token. Please log in again.";
    }

    return res.status(401).json({ success: false, message });
  }
};

/**
 * generateToken — Creates a signed JWT for a user
 * @param {string} id - MongoDB user _id
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = { protect, generateToken };
