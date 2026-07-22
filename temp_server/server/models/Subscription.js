// ============================================================
// models/Subscription.js — Subscription Tracker Schema
// Detects and tracks recurring payments/subscriptions
// ============================================================

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },

    category: {
      type: String,
      enum: [
        "Streaming",
        "Software",
        "Cloud Storage",
        "Music",
        "News",
        "Gaming",
        "Fitness",
        "Food",
        "Education",
        "Other",
      ],
      default: "Other",
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    nextRenewalDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },

    // Reminder settings
    reminderDaysBefore: {
      type: Number,
      default: 3, // remind 3 days before renewal
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    // Auto-detected from expenses (by cron or AI)
    autoDetected: {
      type: Boolean,
      default: false,
    },

    logo: {
      type: String,
      default: "", // URL to service logo
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: yearly cost
subscriptionSchema.virtual("yearlyCost").get(function () {
  const multipliers = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
  return this.amount * (multipliers[this.billingCycle] || 12);
});

subscriptionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
