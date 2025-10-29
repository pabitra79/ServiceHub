// routes/feedback.js
const express = require("express");
const router = express.Router();
const feedbackController = require("../controller/feedbackController");
const {
  requireAdmin,
  requireTechnician,
  requireManager,
  requireUser,
} = require("../middleware/roleMiddleware");

router.get("/submit", requireUser, feedbackController.showFeedbackForm);
// User submits feedback
router.post("/submit", requireUser, feedbackController.submitFeedback);

// Admin views all feedback
router.get("/admin", requireAdmin, feedbackController.getAllFeedback);

// Manager views team feedback
router.get("/manager", requireManager, feedbackController.getManagerFeedback);

// Technician views their feedback
router.get(
  "/technician",
  requireTechnician,
  feedbackController.getTechnicianFeedback
);
router.get("/email/:bookingId", feedbackController.showFeedbackForm);
//
router.post("/email/:bookingId", feedbackController.submitEmailFeedback);

module.exports = router;
