// ============================================================
// controllers/budgetController.js — Budget Management
// ============================================================

const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

// ── POST /api/budgets — Create or update monthly budget ──────
const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { month, year, totalBudget, categories } = req.body;

    // Calculate actual spent amounts from existing expenses
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get actual spending per category for this month
    const spentByCat = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", spent: { $sum: "$amount" } } },
    ]);

    const spentMap = {};
    spentByCat.forEach((s) => { spentMap[s._id] = s.spent; });

    // Merge spent amounts into category budgets
    const categoriesWithSpent = (categories || []).map((cat) => ({
      ...cat,
      spent: spentMap[cat.category] || 0,
      alertSent: false,
    }));

    // Upsert: update if exists, create if not
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month: parseInt(month), year: parseInt(year) },
      { totalBudget, categories: categoriesWithSpent },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, budget });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/budgets — Get current month's budget ────────────
const getBudget = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    let budget = await Budget.findOne({
      user: req.user._id,
      month: targetMonth,
      year: targetYear,
    });

    if (!budget) {
      return res.json({ success: true, budget: null, message: "No budget set for this period" });
    }

    // Refresh spent amounts from actual expenses
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const spentByCat = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", spent: { $sum: "$amount" } } },
    ]);

    const spentMap = {};
    spentByCat.forEach((s) => { spentMap[s._id] = s.spent; });

    budget.categories.forEach((cat) => {
      cat.spent = spentMap[cat.category] || 0;
    });

    const totalSpent = budget.categories.reduce((sum, c) => sum + c.spent, 0);

    res.json({
      success: true,
      budget: {
        ...budget.toObject(),
        totalSpent,
        remaining: budget.totalBudget - totalSpent,
        percentageUsed:
          budget.totalBudget > 0
            ? ((totalSpent / budget.totalBudget) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/budgets/all — Get all budgets ───────────────────
const getAllBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id })
      .sort({ year: -1, month: -1 })
      .limit(24);
    res.json({ success: true, budgets });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/budgets/:id ──────────────────────────────────
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
    res.json({ success: true, message: "Budget deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrUpdateBudget, getBudget, getAllBudgets, deleteBudget };
