// routes/incomeRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { incomeValidator } = require("../middleware/validationMiddleware");
const {
  createIncome, getIncomes, getIncomeById,
  updateIncome, deleteIncome, getIncomeSummary,
} = require("../controllers/incomeController");

router.use(protect);
router.get("/summary", getIncomeSummary);
router.route("/").get(getIncomes).post(incomeValidator, createIncome);
router.route("/:id").get(getIncomeById).put(updateIncome).delete(deleteIncome);

module.exports = router;
