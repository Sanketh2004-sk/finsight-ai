// ============================================================
// middleware/validationMiddleware.js — Input Validation
// Uses express-validator to validate request bodies
// ============================================================

const { body, param, query, validationResult } = require("express-validator");

// Helper: Run this after your validators to return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth Validators ──────────────────────────────────────────
const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  validate,
];

const loginValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// ── Expense Validators ───────────────────────────────────────
const expenseValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),

  body("category").notEmpty().withMessage("Category is required"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),

  validate,
];

// ── Income Validators ────────────────────────────────────────
const incomeValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),

  body("source").notEmpty().withMessage("Income source is required"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),

  validate,
];

// ── Budget Validators ────────────────────────────────────────
const budgetValidator = [
  body("totalBudget")
    .notEmpty()
    .withMessage("Total budget is required")
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),

  body("month")
    .notEmpty()
    .withMessage("Month is required")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),

  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 2020 })
    .withMessage("Year must be 2020 or later"),

  validate,
];

// ── Goal Validators ──────────────────────────────────────────
const goalValidator = [
  body("title").trim().notEmpty().withMessage("Goal title is required"),
  body("targetAmount")
    .notEmpty()
    .withMessage("Target amount is required")
    .isFloat({ min: 1 })
    .withMessage("Target amount must be at least 1"),
  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  expenseValidator,
  incomeValidator,
  budgetValidator,
  goalValidator,
};
