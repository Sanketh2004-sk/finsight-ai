// ============================================================
// controllers/notificationController.js — Notifications
// ============================================================

const Notification = require("../models/Notification");

// ── GET /api/notifications ───────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === "true") filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort("-createdAt").limit(50),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) { next(error); }
};

// ── PUT /api/notifications/:id/read ─────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error) { next(error); }
};

// ── PUT /api/notifications/read-all ─────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) { next(error); }
};

// ── DELETE /api/notifications/:id ───────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
