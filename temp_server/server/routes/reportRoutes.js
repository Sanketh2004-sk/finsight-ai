// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateMonthlyReport, getReports } = require("../controllers/reportController");

router.use(protect);
router.get("/", getReports);
router.get("/monthly", generateMonthlyReport);

module.exports = router;
