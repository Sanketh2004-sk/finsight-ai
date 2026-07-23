// routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { expenseValidator } = require("../middleware/validationMiddleware");
const {
  createExpense, getExpenses, getExpenseById,
  updateExpense, deleteExpense, getExpenseSummary,
} = require("../controllers/expenseController");

router.use(protect); // all expense routes require auth

router.get("/summary", getExpenseSummary);
router.route("/").get(getExpenses).post(expenseValidator, createExpense);
router.route("/:id").get(getExpenseById).put(updateExpense).delete(deleteExpense);

module.exports = router;
