// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDashboardData, getMonthlyTrend,
  getCategoryBreakdown, getSpendingHeatmap,
} = require("../controllers/analyticsController");

router.use(protect);
router.get("/dashboard", getDashboardData);
router.get("/monthly-trend", getMonthlyTrend);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/spending-heatmap", getSpendingHeatmap);

module.exports = router;
