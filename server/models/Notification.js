// ============================================================
// models/Notification.js — In-App Notification Schema
// Stores notifications for budget alerts, goals, reports, etc.
// ============================================================

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "budget_exceeded",
        "budget_warning",   // 80% threshold warning
        "goal_completed",
        "goal_progress",
        "subscription_renewal",
        "monthly_report",
        "fraud_alert",
        "spending_insight",
        "system",
      ],
    },

    title: {
      type: String,
      required: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Optional link to related resource
    link: {
      type: String,
      default: "",
    },

    // Whether the user has read this notification
    read: {
      type: Boolean,
      default: false,
    },

    // Auto-delete old notifications (TTL index: 90 days)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: MongoDB will auto-delete documents after expiresAt
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
