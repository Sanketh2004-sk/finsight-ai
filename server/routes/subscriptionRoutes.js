// routes/subscriptionRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createSubscription, getSubscriptions,
  updateSubscription, deleteSubscription,
} = require("../controllers/subscriptionController");

router.use(protect);
router.route("/").get(getSubscriptions).post(createSubscription);
router.route("/:id").put(updateSubscription).delete(deleteSubscription);

module.exports = router;
