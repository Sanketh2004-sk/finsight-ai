// ============================================================
// controllers/analyticsController.js — Analytics & Charts
// Provides data for Dashboard charts and Analytics page
// ============================================================

const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");

// ── GET /api/analytics/dashboard ─────────────────────────────
// All data needed for the dashboard in one call
const getDashboardData = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      thisMonthExpenses,
      lastMonthExpenses,
      thisMonthIncome,
      recentTransactions,
      categoryBreakdown,
      budget,
    ] = await Promise.all([
      // This month total expenses
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Last month total expenses
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // This month total income
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Recent 5 transactions
      Expense.find({ user: req.user._id })
        .sort("-date")
        .limit(5)
        .lean(),
      // Category breakdown for pie chart
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      // Current month budget
      Budget.findOne({
        user: req.user._id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }),
    ]);

    const totalExpenses = thisMonthExpenses[0]?.total || 0;
    const totalIncome = thisMonthIncome[0]?.total || 0;
    const lastMonthTotal = lastMonthExpenses[0]?.total || 0;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
    const expenseChange =
      lastMonthTotal > 0
        ? (((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
        : 0;

    res.json({
      success: true,
      dashboard: {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate,
        expenseChange,
        transactionCount: thisMonthExpenses[0]?.count || 0,
        recentTransactions,
        categoryBreakdown,
        budget: budget
          ? {
              totalBudget: budget.totalBudget,
              spent: totalExpenses,
              remaining: budget.totalBudget - totalExpenses,
              percentageUsed:
                budget.totalBudget > 0
                  ? ((totalExpenses / budget.totalBudget) * 100).toFixed(1)
                  : 0,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analytics/monthly-trend ─────────────────────────
// Last 12 months of income vs expense for line chart
const getMonthlyTrend = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const [expenseTrend, incomeTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Build a map for quick lookup
    const expenseMap = {};
    expenseTrend.forEach((e) => {
      expenseMap[`${e._id.year}-${e._id.month}`] = e.total;
    });

    const incomeMap = {};
    incomeTrend.forEach((i) => {
      incomeMap[`${i._id.year}-${i._id.month}`] = i.total;
    });

    // Generate last 12 months labels and data
    const labels = [];
    const expenseData = [];
    const incomeData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      labels.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
      expenseData.push(expenseMap[key] || 0);
      incomeData.push(incomeMap[key] || 0);
    }

    res.json({ success: true, labels, expenseData, incomeData });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analytics/category-trend ────────────────────────
// Spending breakdown by category for bar chart
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { months = 1 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const breakdown = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate } } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, breakdown });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/analytics/spending-heatmap ──────────────────────
// Day-of-week spending patterns
const getSpendingHeatmap = async (req, res, next) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const heatmap = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: threeMonthsAgo } } },
      {
        $group: {
          _id: { dayOfWeek: { $dayOfWeek: "$date" }, hour: { $hour: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, heatmap });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getMonthlyTrend,
  getCategoryBreakdown,
  getSpendingHeatmap,
};
