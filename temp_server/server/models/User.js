// ============================================================
// models/User.js — User Schema
// Stores user account data, preferences, and financial profile
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return password in queries by default
    },

    // ── Profile ─────────────────────────────────────────────
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // Cloudinary public_id for deletion
    },

    phone: { type: String, trim: true },

    // ── Preferences ─────────────────────────────────────────
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"],
    },

    language: {
      type: String,
      default: "en",
      enum: ["en", "hi", "mr", "te", "ta"], // English + Indian languages
    },

    theme: {
      type: String,
      default: "dark",
      enum: ["dark", "light"],
    },

    // ── Financial Profile (used for Health Score) ────────────
    financialProfile: {
      monthlyIncome: { type: Number, default: 0 },
      hasEmergencyFund: { type: Boolean, default: false },
      emergencyFundMonths: { type: Number, default: 0 }, // months of expenses covered
      hasDebt: { type: Boolean, default: false },
      debtAmount: { type: Number, default: 0 },
    },

    // ── Password Reset ───────────────────────────────────────
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ── Notifications Preferences ────────────────────────────
    notificationPreferences: {
      email: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      goalAlerts: { type: Boolean, default: true },
      subscriptionReminders: { type: Boolean, default: true },
      monthlyReport: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true, // auto-creates createdAt and updatedAt fields
  }
);

// ──────────────────────────────────────────────────────────
// Pre-save Hook: Hash password before saving
// This runs every time a user document is saved
// ──────────────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash the password if it was modified (not on every save)
  if (!this.isModified("password")) return next();

  // Hash with 12 salt rounds — secure but not too slow
  const salt = await bcrypt.genSalt(
    parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  );
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ──────────────────────────────────────────────────────────
// Instance Method: Compare entered password with hashed one
// Usage: await user.matchPassword(enteredPassword)
// ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
