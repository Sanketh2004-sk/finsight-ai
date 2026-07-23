// ============================================================
// models/Goal.js — Savings Goal Schema
// Tracks financial goals with AI-generated saving plans
// ============================================================

const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },

    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be at least 1"],
    },

    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },

    category: {
      type: String,
      enum: [
        "Emergency Fund",
        "Vacation",
        "Education",
        "Home",
        "Vehicle",
        "Wedding",
        "Retirement",
        "Investment",
        "Other",
      ],
      default: "Other",
    },

    // AI-generated saving plan (array of monthly targets)
    aiPlan: {
      monthlyTarget: { type: Number, default: 0 },
      suggestions: [{ type: String }], // AI tips
      generatedAt: { type: Date },
    },

    // Track deposit history
    deposits: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],

    // Notification flags
    completedNotificationSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Virtual: percentage progress
goalSchema.virtual("progress").get(function () {
  if (this.targetAmount === 0) return 0;
  return Math.min(
    ((this.currentAmount / this.targetAmount) * 100).toFixed(2),
    100
  );
});

// Virtual: remaining amount
goalSchema.virtual("remaining").get(function () {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual: days remaining
goalSchema.virtual("daysRemaining").get(function () {
  const today = new Date();
  const diff = this.deadline - today;
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Goal", goalSchema);
