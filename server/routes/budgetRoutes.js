// routes/budgetRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { budgetValidator } = require("../middleware/validationMiddleware");
const { createOrUpdateBudget, getBudget, getAllBudgets, deleteBudget } = require("../controllers/budgetController");

router.use(protect);
router.get("/all", getAllBudgets);
router.route("/").get(getBudget).post(budgetValidator, createOrUpdateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
