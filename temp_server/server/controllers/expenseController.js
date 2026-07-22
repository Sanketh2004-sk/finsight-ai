// ============================================================
// controllers/expenseController.js — Expense CRUD
// Full create/read/update/delete with search, filter, sort
// ============================================================

const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const { uploadToCloudinary, deleteFromCloudinary } = require("../services/cloudinaryService");
const { detectFraud } = require("../services/aiService");

// ── POST /api/expenses ───────────────────────────────────────
const createExpense = async (req, res, next) => {
  try {
    const expenseData = { ...req.body, user: req.user._id };

    // Run AI fraud detection against last 3 months of user expenses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const historicalExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: threeMonthsAgo },
    }).lean();

    const fraudResult = detectFraud(expenseData, historicalExpenses);
    expenseData.isFraudulent = fraudResult.isFraudulent;

    const expense = await Expense.create(expenseData);

    // Update budget spending for this category
    await updateBudgetSpent(req.user._id, expense.category, expense.amount, expense.date);

    // Create fraud notification if flagged
    if (fraudResult.isFraudulent) {
      await Notification.create({
        user: req.user._id,
        type: "fraud_alert",
        title: "⚠️ Suspicious Transaction Detected",
        message: `Expense of ₹${expense.amount} in ${expense.category} looks unusual. ${fraudResult.reasons[0] || ""}`,
        link: "/expenses",
      });
    }

    res.status(201).json({
      success: true,
      expense,
      fraudAlert: fraudResult.isFraudulent ? fraudResult : null,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/expenses ────────────────────────────────────────
// Supports: ?category=&startDate=&endDate=&search=&sort=&page=&limit=
const getExpenses = async (req, res, next) => {
  try {
    const {
      category,
      startDate,
      endDate,
      search,
      sort = "-date",
      page = 1,
      limit = 20,
      paymentMethod,
      minAmount,
      maxAmount,
    } = req.query;

    // Build filter query
    const filter = { user: req.user._id };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Full-text search on description/merchant/notes
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { merchant: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/expenses/:id ────────────────────────────────────
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id, // ensure user owns this expense
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/expenses/:id ────────────────────────────────────
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/expenses/:id ─────────────────────────────────
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // Delete receipt image from Cloudinary if exists
    if (expense.receipt?.publicId) {
      await deleteFromCloudinary(expense.receipt.publicId);
    }

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/expenses/summary ────────────────────────────────
// Monthly totals for the dashboard
const getExpenseSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Aggregate total and category breakdown
    const [totalResult, categoryBreakdown] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const total = totalResult[0]?.total || 0;
    const count = totalResult[0]?.count || 0;

    res.json({
      success: true,
      summary: {
        total,
        count,
        month: targetMonth,
        year: targetYear,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c._id,
          amount: c.total,
          count: c.count,
          percentage: total > 0 ? ((c.total / total) * 100).toFixed(1) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: Update budget spent when expense is created ──────
const updateBudgetSpent = async (userId, category, amount, date) => {
  try {
    const expDate = new Date(date || Date.now());
    const month = expDate.getMonth() + 1;
    const year = expDate.getFullYear();

    const budget = await Budget.findOne({ user: userId, month, year });
    if (!budget) return;

    // Find matching category budget and increment spent
    const catBudget = budget.categories.find((c) => c.category === category);
    if (catBudget) {
      catBudget.spent += amount;

      // Check if 80% or 100% of category budget is reached
      const pct = (catBudget.spent / catBudget.limit) * 100;

      if (pct >= 100 && !catBudget.alertSent) {
        catBudget.alertSent = true;
        await Notification.create({
          user: userId,
          type: "budget_exceeded",
          title: `🚨 Budget Exceeded: ${category}`,
          message: `You've exceeded your ${category} budget of ₹${catBudget.limit}. Spent: ₹${catBudget.spent.toFixed(0)}`,
          link: "/budget",
        });
      } else if (pct >= 80 && pct < 100 && !catBudget.alertSent) {
        await Notification.create({
          user: userId,
          type: "budget_warning",
          title: `⚠️ Budget Alert: ${category}`,
          message: `You've used 80% of your ${category} budget. ₹${(catBudget.limit - catBudget.spent).toFixed(0)} remaining.`,
          link: "/budget",
        });
      }
    }

    await budget.save();
  } catch (err) {
    // Non-critical — don't break the expense creation
    console.error("Budget update error:", err.message);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};
