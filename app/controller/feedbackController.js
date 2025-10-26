// controllers/feedbackController.js
const Feedback = require("../model/feedbackSchema");
const Booking = require("../model/bookingSchema");

class FeedbackController {
  async showFeedbackForm(req, res) {
    try {
      const userId = req.user.userId;

      const completedBookings = await Booking.find({
        customerId: userId,
        status: "completed",
        hasFeedback: { $ne: true },
      }).populate("technicianId", "name");

      res.render("feedback-form", {
        title: "Submit Feedback - ServiceHub",
        user: req.user,
        bookings: completedBookings,
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Feedback form error:", error);
      req.flash("error", "Error loading feedback form");
      res.redirect("/bookings/my-bookings");
    }
  }

  async submitFeedback(req, res) {
    try {
      const { bookingId, rating, comment } = req.body;
      const userId = req.user.userId;

      const booking = await Booking.findById(bookingId).populate(
        "technicianId"
      );

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/my-bookings");
      }

      if (booking.customerId.toString() !== userId.toString()) {
        req.flash("error", "Not authorized to give feedback for this booking");
        return res.redirect("/bookings/my-bookings");
      }

      if (booking.status !== "completed") {
        req.flash(
          "error",
          "Feedback can only be submitted for completed services"
        );
        return res.redirect("/bookings/my-bookings");
      }

      const existingFeedback = await Feedback.findOne({ bookingId });
      if (existingFeedback) {
        req.flash("error", "Feedback already submitted for this booking");
        return res.redirect("/bookings/my-bookings");
      }

      const feedback = new Feedback({
        bookingId,
        userId,
        technicianId: booking.technicianId._id,
        rating,
        comment,
      });

      await feedback.save();
      await Booking.findByIdAndUpdate(bookingId, { hasFeedback: true });

      req.flash("success", "Thank you for your feedback!");
      res.redirect("/bookings/my-bookings");
    } catch (error) {
      console.error("Feedback submission error:", error);
      req.flash("error", "Server error occurred");
      res.redirect("/bookings/my-bookings");
    }
  }

  // Admin views all feedback
  async getAllFeedback(req, res) {
    try {
      const feedback = await Feedback.find({ status: "active" })
        .populate("userId", "name email")
        .populate("technicianId", "name")
        .populate("bookingId", "serviceType status preferredDate")
        .sort({ createdAt: -1 });

      res.render("feedback", {
        title: "All Customer Feedback - Admin",
        feedback,
        user: req.user,
        role: "admin",
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Admin feedback error:", error);
      req.flash("error", "Error loading feedback");
      res.redirect("/admin/dashboard");
    }
  }

  // Manager views team feedback
  async getManagerFeedback(req, res) {
    try {
      const managerId = req.user.id;

      const feedback = await Feedback.find({ status: "active" })
        .populate("userId", "name email")
        .populate("technicianId", "name manager")
        .populate("bookingId", "serviceType status preferredDate")
        .sort({ createdAt: -1 });

      const teamFeedback = feedback.filter(
        (fb) =>
          fb.technicianId &&
          fb.technicianId.manager &&
          fb.technicianId.manager.toString() === managerId
      );

      res.render("feedback", {
        title: "Team Feedback - Manager",
        feedback: teamFeedback,
        user: req.user,
        role: "manager",
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Manager feedback error:", error);
      req.flash("error", "Error loading team feedback");
      res.redirect("/manager/dashboard");
    }
  }

  // Technician views their feedback
  async getTechnicianFeedback(req, res) {
    try {
      const technicianId = req.user.userId;

      console.log("=== TECHNICIAN FEEDBACK DEBUG ===");
      console.log("Technician ID:", technicianId);

      const feedback = await Feedback.find({
        technicianId,
        status: "active",
      })
        .populate("userId", "name email")
        .populate("bookingId", "serviceType status preferredDate")
        .sort({ createdAt: -1 });

      console.log("Found feedback entries:", feedback.length);

      const averageRating =
        feedback.length > 0
          ? (
              feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length
            ).toFixed(1)
          : 0;

      console.log("Average rating:", averageRating);

      res.render("feedback", {
        title: "My Feedback - Technician",
        feedback,
        averageRating,
        user: req.user,
        role: "technician",
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Technician feedback error:", error);
      req.flash("error", "Error loading feedback");
      res.redirect("/technician/dashboard");
    }
  }
}

module.exports = new FeedbackController();
