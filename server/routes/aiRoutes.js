// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadReceipt } = require("../middleware/uploadMiddleware");
const {
  scanReceipt, voiceEntry, aiChat,
  spendingCoach, getHealthScore, predictSpending, aiGoalPlan,
} = require("../controllers/aiController");

router.use(protect);

router.post("/scan-receipt", uploadReceipt, scanReceipt);
router.post("/voice-entry", voiceEntry);
router.post("/chat", aiChat);
router.get("/spending-coach", spendingCoach);
router.get("/health-score", getHealthScore);
router.get("/predict", predictSpending);
router.post("/goal-plan", aiGoalPlan);

module.exports = router;
