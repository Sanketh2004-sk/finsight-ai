// ============================================================
// models/Expense.js — Expense Schema
// Tracks all user spending with rich metadata
// ============================================================

const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // Which user owns this expense
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // index for fast queries
    },

    // ── Core Fields ──────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Food & Dining",
        "Shopping",
        "Transportation",
        "Entertainment",
        "Healthcare",
        "Education",
        "Utilities",
        "Rent",
        "Travel",
        "Subscriptions",
        "Groceries",
        "Fitness",
        "Personal Care",
        "Insurance",
        "Investment",
        "Gifts & Donations",
        "Other",
      ],
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    // ── Rich Metadata ────────────────────────────────────────
    merchant: {
      type: String,
      trim: true,
      maxlength: [100, "Merchant name cannot exceed 100 characters"],
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Credit Card",
        "Debit Card",
        "UPI",
        "Net Banking",
        "Wallet",
        "Other",
      ],
      default: "UPI",
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ── Receipt Image (from Gemini Vision scanner) ───────────
    receipt: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // ── AI Metadata ──────────────────────────────────────────
    aiExtracted: {
      type: Boolean,
      default: false, // true if this expense was created via AI receipt scan
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null, // confidence score from Gemini (0-1)
    },

    isFraudulent: {
      type: Boolean,
      default: false, // flagged by AI fraud detection
    },

    // ── Recurring Expense Fields ─────────────────────────────
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null, // links to the subscription that generated this
    },

    // ── Tax (extracted from receipts) ────────────────────────
    tax: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

// ──────────────────────────────────────────────────────────
// Indexes for performance on common query patterns
// ──────────────────────────────────────────────────────────
expenseSchema.index({ user: 1, date: -1 }); // get user expenses sorted by date
expenseSchema.index({ user: 1, category: 1 }); // filter by category
expenseSchema.index({ user: 1, date: -1, category: 1 }); // combined filter

module.exports = mongoose.model("Expense", expenseSchema);
