// routes/goalRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { goalValidator } = require("../middleware/validationMiddleware");
const {
  createGoal, getGoals, getGoalById,
  updateGoal, deleteGoal, depositToGoal,
} = require("../controllers/goalController");

router.use(protect);
router.route("/").get(getGoals).post(goalValidator, createGoal);
router.route("/:id").get(getGoalById).put(updateGoal).delete(deleteGoal);
router.post("/:id/deposit", depositToGoal);

module.exports = router;
