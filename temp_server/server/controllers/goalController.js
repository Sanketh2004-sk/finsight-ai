// ============================================================
// controllers/goalController.js — Savings Goals
// ============================================================

const Goal = require("../models/Goal");
const Notification = require("../models/Notification");

// ── POST /api/goals ──────────────────────────────────────────
const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/goals ───────────────────────────────────────────
const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const goals = await Goal.find(filter).sort("-createdAt");
    res.json({ success: true, goals });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/goals/:id ───────────────────────────────────────
const getGoalById = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    res.json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/goals/:id ───────────────────────────────────────
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    res.json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/goals/:id ────────────────────────────────────
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
    res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/goals/:id/deposit ──────────────────────────────
// Add money toward a savings goal
const depositToGoal = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid deposit amount required" });
    }

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

    goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    goal.deposits.push({ amount, note });

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount && !goal.completedNotificationSent) {
      goal.status = "completed";
      goal.completedNotificationSent = true;

      await Notification.create({
        user: req.user._id,
        type: "goal_completed",
        title: "🎉 Goal Achieved!",
        message: `Congratulations! You've reached your goal: "${goal.title}" (₹${goal.targetAmount})`,
        link: "/goals",
      });
    }

    await goal.save();
    res.json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

module.exports = { createGoal, getGoals, getGoalById, updateGoal, deleteGoal, depositToGoal };
