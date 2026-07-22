// ============================================================
// services/cloudinaryService.js — Cloudinary Upload Helpers
// Handles uploading files from memory buffers to Cloudinary
// ============================================================

const cloudinary = require("../config/cloudinary");

/**
 * uploadToCloudinary — Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {string} folder - Cloudinary folder name (e.g. "avatars", "receipts")
 * @param {Object} options - Extra Cloudinary upload options
 * @returns {Object} { url, publicId }
 */
const uploadToCloudinary = (buffer, folder = "aixpense", options = {}) => {
  return new Promise((resolve, reject) => {
    // Use upload_stream since we have a Buffer (not a file path)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `aixpense/${folder}`,
        resource_type: "auto", // auto-detect image/pdf/video
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    // Write the buffer into the stream
    uploadStream.end(buffer);
  });
};

/**
 * deleteFromCloudinary — Removes a file from Cloudinary
 * @param {string} publicId - The Cloudinary public_id to delete
 * @param {string} resourceType - "image" | "raw" (for PDFs)
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
