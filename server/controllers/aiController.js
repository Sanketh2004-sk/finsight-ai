// ============================================================
// controllers/aiController.js — All AI Feature Endpoints
// Orchestrates AI services with user data context
// ============================================================

const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const User = require("../models/User");
const {
  scanReceiptWithGemini,
  chatWithAI,
  generateSpendingReport,
  explainHealthScore,
  generateGoalPlan,
  parseVoiceExpense,
  detectFraud,
  predictNextMonthSpending,
  calculateHealthScore,
} = require("../services/aiService");
const { uploadToCloudinary } = require("../services/cloudinaryService");

// ── POST /api/ai/scan-receipt ────────────────────────────────
// Upload a receipt image → Gemini Vision extracts expense data
const scanReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No receipt image provided" });
    }

    // Upload to Cloudinary first (for storage)
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, "receipts");

    // Extract data using Gemini Vision
    const extractedData = await scanReceiptWithGemini(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      extracted: extractedData,
      receiptUrl: url,
      receiptPublicId: publicId,
      message: "Review the extracted data below before saving",
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/voice-entry ─────────────────────────────────
// Record voice → Sarvam AI transcribes → OpenAI parses expense
const voiceEntry = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No audio file provided" });
    }

    const language = req.body.language || "en-IN";
    const result = await parseVoiceExpense(req.file.buffer, language);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/chat ────────────────────────────────────────
// Chat with AI about your finances
const aiChat = async (req, res, next) => {
  try {
    const { messages } = req.body; // [{ role: "user"|"assistant", content: "..." }]

    // Build user financial context for the AI
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [expenseSummary, incomeSummary, budget, goals] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Budget.findOne({ user: req.user._id, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: req.user._id, status: "active" }).countDocuments(),
    ]);

    const monthlyExpenses = expenseSummary.reduce((s, e) => s + e.total, 0);
    const monthlyIncome = incomeSummary[0]?.total || 0;
    const topCategory = expenseSummary[0]?._id || "N/A";
    const budgetUsed = budget ? ((monthlyExpenses / budget.totalBudget) * 100).toFixed(1) : 0;

    const userContext = {
      monthlyIncome,
      monthlyExpenses,
      balance: monthlyIncome - monthlyExpenses,
      topCategory,
      budgetUsed,
      activeGoals: goals,
    };

    const reply = await chatWithAI(messages, userContext);
    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/ai/spending-coach ───────────────────────────────
// Generate weekly/monthly/yearly spending report
const spendingCoach = async (req, res, next) => {
  try {
    const { period = "monthly" } = req.query;
    const now = new Date();

    let startDate, prevStartDate, prevEndDate;

    if (period === "weekly") {
      startDate = new Date(now.setDate(now.getDate() - 7));
      prevStartDate = new Date(new Date().setDate(new Date().getDate() - 14));
      prevEndDate = new Date(new Date().setDate(new Date().getDate() - 8));
    } else if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    }

    const [currentExpenses, prevExpenses, currentIncome] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalExpenses = currentExpenses.reduce((s, e) => s + e.total, 0);
    const totalIncome = currentIncome[0]?.total || 0;
    const prevTotal = prevExpenses[0]?.total || totalExpenses;
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;
    const changePercent = prevTotal > 0 ? (((totalExpenses - prevTotal) / prevTotal) * 100).toFixed(1) : 0;

    const categoryBreakdown = {};
    currentExpenses.forEach((e) => { categoryBreakdown[e._id] = e.total; });

    const report = await generateSpendingReport(
      { totalIncome, totalExpenses, savings, savingsRate, categoryBreakdown, changePercent },
      period
    );

    res.json({ success: true, period, report, stats: { totalIncome, totalExpenses, savings, savingsRate } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/ai/health-score ─────────────────────────────────
const getHealthScore = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();

    // Get last 3 months of expense data
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const monthlyExpenseData = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: threeMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const monthlyIncomeData = await Income.aggregate([
      { $match: { user: req.user._id, date: { $gte: threeMonthsAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const avgMonthlyExpense =
      monthlyExpenseData.reduce((s, m) => s + m.total, 0) /
      Math.max(monthlyExpenseData.length, 1);

    const avgMonthlyIncome = (monthlyIncomeData[0]?.total || 0) / 3;

    // Budget adherence: how often user stays within budget
    const budget = await Budget.findOne({
      user: req.user._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    const budgetAdherence =
      budget && budget.totalBudget > 0
        ? Math.min((1 - avgMonthlyExpense / budget.totalBudget) * 100, 100)
        : 50;

    // Spending consistency: lower variance = higher score
    const totals = monthlyExpenseData.map((m) => m.total);
    const meanExpense = totals.reduce((a, b) => a + b, 0) / Math.max(totals.length, 1);
    const variance =
      totals.reduce((sum, val) => sum + Math.pow(val - meanExpense, 2), 0) /
      Math.max(totals.length, 1);
    const stdDev = Math.sqrt(variance);
    const spendingConsistency = Math.max(100 - (stdDev / Math.max(meanExpense, 1)) * 100, 0);

    const savingsRate =
      avgMonthlyIncome > 0
        ? ((avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome) * 100
        : 0;

    const { score, grade, factors } = calculateHealthScore({
      savingsRate: Math.max(savingsRate, 0),
      budgetAdherence: Math.max(budgetAdherence, 0),
      spendingConsistency,
      emergencyFundMonths: user.financialProfile?.emergencyFundMonths || 0,
      debtAmount: user.financialProfile?.debtAmount || 0,
      monthlyIncome: avgMonthlyIncome,
    });

    const explanation = await explainHealthScore(score, {
      savingsRate: Math.max(savingsRate, 0).toFixed(1),
      budgetAdherence: Math.max(budgetAdherence, 0).toFixed(1),
      spendingConsistency: spendingConsistency.toFixed(1),
      emergencyFundScore: ((user.financialProfile?.emergencyFundMonths || 0) / 6) * 100,
      debtRatio:
        avgMonthlyIncome > 0
          ? ((user.financialProfile?.debtAmount || 0) / avgMonthlyIncome) * 100
          : 0,
    });

    res.json({ success: true, score, grade, factors, explanation });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/ai/predict ──────────────────────────────────────
const predictSpending = async (req, res, next) => {
  try {
    // Get last 6 months of monthly totals
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyTotalsRaw, categoryDataRaw] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { category: "$category", year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const monthlyTotals = monthlyTotalsRaw.map((m) => m.total);

    // Build category monthly data
    const categoryMonthlyData = {};
    categoryDataRaw.forEach((c) => {
      const cat = c._id.category;
      if (!categoryMonthlyData[cat]) categoryMonthlyData[cat] = [];
      categoryMonthlyData[cat].push(c.total);
    });

    const prediction = predictNextMonthSpending(monthlyTotals, categoryMonthlyData);
    res.json({ success: true, prediction });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/goal-plan ───────────────────────────────────
const aiGoalPlan = async (req, res, next) => {
  try {
    const { goalId } = req.body;

    const goal = await Goal.findOne({ _id: goalId, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [incomeResult, expenseResult] = await Promise.all([
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const userFinances = {
      monthlyIncome: incomeResult[0]?.total || 0,
      monthlyExpenses: expenseResult[0]?.total || 0,
    };

    const plan = await generateGoalPlan(goal.toObject(), userFinances);

    // Save plan to the goal document
    goal.aiPlan = {
      monthlyTarget: plan.monthlyTarget,
      suggestions: plan.suggestions,
      generatedAt: new Date(),
    };
    await goal.save();

    res.json({ success: true, plan, goal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanReceipt,
  voiceEntry,
  aiChat,
  spendingCoach,
  getHealthScore,
  predictSpending,
  aiGoalPlan,
};
