// ============================================================
// middleware/uploadMiddleware.js — Multer File Upload Config
// Handles file uploads for receipts and profile images
// ============================================================

const multer = require("multer");
const path = require("path");

// ── Store files in memory (as Buffer) before uploading to Cloudinary ──
// We don't save to disk — goes directly to Cloudinary
const storage = multer.memoryStorage();

// ── File filter: only allow images and PDFs ──────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // accept file
  } else {
    cb(new Error("Only images (jpg, png, webp, gif) and PDFs are allowed!"), false);
  }
};

// ── Multer instance for profile images (max 5MB) ─────────────
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
}).single("avatar"); // field name is "avatar"

// ── Multer instance for receipt images (max 10MB) ────────────
const uploadReceipt = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single("receipt"); // field name is "receipt"

// ── Multer instance for bank statement import (CSV/PDF) ──────
const uploadStatement = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and PDF files are allowed for bank statements!"), false);
    }
  },
}).single("statement");

module.exports = { uploadAvatar, uploadReceipt, uploadStatement };
