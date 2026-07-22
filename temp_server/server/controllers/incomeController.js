// ============================================================
// controllers/incomeController.js — Income CRUD
// ============================================================

const Income = require("../models/Income");

// ── POST /api/incomes ────────────────────────────────────────
const createIncome = async (req, res, next) => {
  try {
    const income = await Income.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/incomes ─────────────────────────────────────────
const getIncomes = async (req, res, next) => {
  try {
    const { source, startDate, endDate, sort = "-date", page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incomes, total] = await Promise.all([
      Income.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Income.countDocuments(filter),
    ]);

    res.json({
      success: true,
      incomes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/incomes/:id ─────────────────────────────────────
const getIncomeById = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/incomes/:id ─────────────────────────────────────
const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.json({ success: true, income });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/incomes/:id ──────────────────────────────────
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ success: false, message: "Income not found" });
    res.json({ success: true, message: "Income deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/incomes/summary ─────────────────────────────────
const getIncomeSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const [totalResult, sourceBreakdown] = await Promise.all([
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$source", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        total: totalResult[0]?.total || 0,
        count: totalResult[0]?.count || 0,
        month: targetMonth,
        year: targetYear,
        sourceBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createIncome, getIncomes, getIncomeById, updateIncome, deleteIncome, getIncomeSummary };
