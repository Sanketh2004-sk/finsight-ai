// ============================================================
// models/Report.js — Generated Report Schema
// Stores monthly/yearly PDF reports for users
// ============================================================

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    // Period the report covers
    period: {
      month: { type: Number, min: 1, max: 12 }, // null for yearly
      year: { type: Number, required: true },
    },

    // Cloudinary URL of the generated PDF
    fileUrl: {
      type: String,
      default: "",
    },

    filePublicId: {
      type: String,
      default: "",
    },

    // Summary stats embedded in the report
    summary: {
      totalIncome: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      savingsRate: { type: Number, default: 0 },
      topCategory: { type: String, default: "" },
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ user: 1, "period.year": -1, "period.month": -1 });

module.exports = mongoose.model("Report", reportSchema);
