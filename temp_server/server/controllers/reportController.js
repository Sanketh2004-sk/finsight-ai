// ============================================================
// controllers/reportController.js — PDF Report Generation
// ============================================================

const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Report = require("../models/Report");
const { generateMonthlyPDF } = require("../services/pdfService");
const { uploadToCloudinary } = require("../services/cloudinaryService");

// ── GET /api/reports/monthly — Generate and download monthly PDF
const generateMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Fetch all data needed for the report
    const [expenseAgg, incomeAgg, categoryAgg, recentExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Income.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Expense.find({ user: req.user._id, date: { $gte: startDate, $lte: endDate } })
        .sort("-date").limit(20).lean(),
    ]);

    const totalExpenses = expenseAgg[0]?.total || 0;
    const totalIncome = incomeAgg[0]?.total || 0;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    const categoryBreakdown = {};
    categoryAgg.forEach((c) => { categoryBreakdown[c._id] = c.total; });

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const period = `${months[targetMonth - 1]} ${targetYear}`;

    // Generate PDF buffer
    const pdfBuffer = await generateMonthlyPDF({
      user: { name: req.user.name, email: req.user.email },
      period,
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      categoryBreakdown,
      transactions: recentExpenses,
    });

    // Save report record to DB
    await Report.findOneAndUpdate(
      { user: req.user._id, type: "monthly", "period.month": targetMonth, "period.year": targetYear },
      {
        type: "monthly",
        period: { month: targetMonth, year: targetYear },
        summary: { totalIncome, totalExpenses, balance, savingsRate, topCategory: categoryAgg[0]?._id || "" },
        generatedAt: new Date(),
      },
      { upsert: true }
    );

    // Stream PDF to browser
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="AiXpense_Report_${period.replace(" ", "_")}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/reports — List all reports ─────────────────────
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ "period.year": -1, "period.month": -1 });
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateMonthlyReport, getReports };
