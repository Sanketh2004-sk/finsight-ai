// ============================================================
// routes/authRoutes.js
// ============================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../middleware/uploadMiddleware");
const {
  registerValidator, loginValidator,
} = require("../middleware/validationMiddleware");
const {
  register, login, getProfile, updateProfile,
  uploadAvatar: uploadAvatarCtrl, changePassword,
  forgotPassword, resetPassword,
} = require("../controllers/authController");

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes (require JWT)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/upload-avatar", protect, uploadAvatar, uploadAvatarCtrl);
router.put("/change-password", protect, changePassword);

module.exports = router;
