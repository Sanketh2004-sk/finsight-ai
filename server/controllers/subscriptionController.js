// ============================================================
// controllers/subscriptionController.js — Subscription Tracker
// ============================================================

const Subscription = require("../models/Subscription");

const createSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, subscription: sub });
  } catch (error) { next(error); }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = { user: req.user._id };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const subscriptions = await Subscription.find(filter).sort("nextRenewalDate");

    // Calculate totals
    const monthlyTotal = subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => {
        const divisors = { weekly: 4.33, monthly: 1, quarterly: 0.33, yearly: 1 / 12 };
        return sum + s.amount * (divisors[s.billingCycle] || 1);
      }, 0);

    res.json({ success: true, subscriptions, monthlyTotal: monthlyTotal.toFixed(2) });
  } catch (error) { next(error); }
};

const updateSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
    res.json({ success: true, subscription: sub });
  } catch (error) { next(error); }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
    res.json({ success: true, message: "Subscription deleted" });
  } catch (error) { next(error); }
};

module.exports = { createSubscription, getSubscriptions, updateSubscription, deleteSubscription };
