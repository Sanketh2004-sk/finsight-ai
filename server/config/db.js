// ============================================================
// config/db.js — MongoDB Atlas Connection
// Uses Mongoose to connect to MongoDB
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options ensure a stable connection
      serverSelectionTimeoutMS: 5000, // timeout after 5s if can't reach MongoDB
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    // Exit process with failure — app can't run without DB
    process.exit(1);
  }
};

module.exports = connectDB;
console.log("Server initialized successfully");
