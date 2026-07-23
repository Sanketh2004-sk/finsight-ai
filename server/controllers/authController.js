// ============================================================
// controllers/authController.js — Authentication Logic
// Handles register, login, password management, and profile
// ============================================================

const crypto = require("crypto");
const User = require("../models/User");
const { generateToken } = require("../middleware/authMiddleware");
const { sendPasswordResetEmail } = require("../services/emailService");
const { uploadToCloudinary, deleteFromCloudinary } = require("../services/cloudinaryService");

// ── Helper: Send token in response ───────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
      language: user.language,
      theme: user.theme,
    },
  });
};

// ── POST /api/auth/register ──────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create user (password hashed by pre-save hook in User model)
    const user = await User.create({ name, email, password });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password (it's excluded by default with select: false)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare entered password with stored hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/profile ────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/auth/profile ────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "currency",
      "language",
      "theme",
      "financialProfile",
      "notificationPreferences",
    ];

    // Build update object with only allowed fields
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,     // return updated document
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/upload-avatar ─────────────────────────────
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if it exists
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    // Upload new avatar to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "avatars",
      {
        transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
      }
    );

    user.avatar = { url, publicId };
    await user.save();

    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/auth/change-password ────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    // Generate a secure random token (not JWT — this is a one-time use token)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store hashed version in DB (so even if DB is compromised, token is useless)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Send plain token in email link (user will use this to reset)
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/reset-password/:token ─────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // token not expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or has expired",
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
};
