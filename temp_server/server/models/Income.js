// ============================================================
// models/Income.js — Income Schema
// Tracks all income sources for the user
// ============================================================

const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    source: {
      type: String,
      required: [true, "Income source is required"],
      enum: [
        "Salary",
        "Freelance",
        "Business",
        "Investment",
        "Rental",
        "Bonus",
        "Gift",
        "Refund",
        "Other",
      ],
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    currency: {
      type: String,
      default: "INR",
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, source: 1 });

module.exports = mongoose.model("Income", incomeSchema);
