// ============================================================
// models/Budget.js — Budget Schema
// Monthly budget with per-category limits and spending tracking
// ============================================================

const mongoose = require("mongoose");

// Sub-schema for each category budget
const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
    min: [0, "Budget limit cannot be negative"],
  },
  spent: {
    type: Number,
    default: 0, // updated dynamically when expenses are added
    min: 0,
  },
  alertSent: {
    type: Boolean,
    default: false, // true if 80% alert has already been sent
  },
});

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Budget period
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },

    // Overall monthly budget limit
    totalBudget: {
      type: Number,
      required: [true, "Total budget is required"],
      min: [0, "Budget cannot be negative"],
    },

    // Per-category budgets (optional, user can set specific limits)
    categories: [categoryBudgetSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index: one budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Virtual: calculate total spent across all categories
budgetSchema.virtual("totalSpent").get(function () {
  return this.categories.reduce((sum, cat) => sum + cat.spent, 0);
});

// Virtual: remaining budget
budgetSchema.virtual("remaining").get(function () {
  return this.totalBudget - this.totalSpent;
});

// Virtual: percentage used
budgetSchema.virtual("percentageUsed").get(function () {
  if (this.totalBudget === 0) return 0;
  return ((this.totalSpent / this.totalBudget) * 100).toFixed(2);
});

module.exports = mongoose.model("Budget", budgetSchema);
