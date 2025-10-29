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

  // Get feedback for manager's team
  async getManagerTeamFeedback(managerId) {
    // Get technicians managed by this manager
    const technicians = await Technician.find({ managerId: managerId });
    const technicianIds = technicians.map((t) => t.userId);

    return await Feedback.find({
      technicianId: { $in: technicianIds },
      status: "active",
    })
      .populate("userId", "name")
      .populate("technicianId", "name specialization")
      .populate("bookingId", "serviceType problemDescription")
      .sort({ createdAt: -1 });
  }

  // Get feedback for specific user
  async getAllFeedback(req, res) {
    try {
      console.log("🔄 ADMIN FEEDBACK - Method called");
      console.log("User:", req.user);

      const feedback = await Feedback.find({ status: "active" })
        .populate("userId", "name email")
        .populate("technicianId", "name")
        .populate("bookingId", "serviceType status preferredDate")
        .sort({ createdAt: -1 });

      console.log("📊 Feedback found:", feedback.length);

      res.render("feedback", {
        title: "All Customer Feedback - Admin",
        feedback,
        user: req.user,
        role: "admin",
        messages: req.flash(),
      });

      console.log("✅ Admin feedback page rendered");
    } catch (error) {
      console.error("❌ Admin feedback error:", error);
      req.flash("error", "Error loading feedback");
      res.redirect("/admin/dashboard");
    }
  }

  // Get average rating for technician
  async getTechnicianAverageRating(technicianId) {
    const result = await Feedback.aggregate([
      {
        $match: {
          technicianId: new mongoose.Types.ObjectId(technicianId),
          status: "active",
        },
      },
      {
        $group: {
          _id: "$technicianId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingBreakdown: {
            $push: "$rating",
          },
        },
      },
    ]);

    return (
      result[0] || { averageRating: 0, totalReviews: 0, ratingBreakdown: [] }
    );
  }
  async showEmailFeedbackForm(req, res) {
    try {
      const { bookingId } = req.params;
      const { token } = req.query;

      console.log("Email feedback request:", { bookingId, token });

      const booking = await Booking.findById(bookingId)
        .populate("technicianId", "name specialization")
        .populate("customerId", "name email");

      if (!booking) {
        return res.render("feedback/feedback-error", {
          title: "Invalid Request",
          message: "Booking not found.",
        });
      }

      // Validate token
      if (booking.feedbackToken !== token) {
        return res.render("feedback/feedback-error", {
          title: "Invalid Link",
          message: "This feedback link is invalid or has expired.",
        });
      }

      // Check if feedback already submitted
      const existingFeedback = await Feedback.findOne({ bookingId });
      if (existingFeedback) {
        return res.render("feedback/feedback-thankyou", {
          title: "Feedback Already Submitted",
          message:
            "You have already submitted feedback for this booking. Thank you!",
        });
      }

      res.render("feedback/email-feedback-form", {
        title: "Service Feedback - ServiceHub",
        booking: booking,
        token: token,
      });
    } catch (error) {
      console.error("Email feedback form error:", error);
      res.render("feedback/feedback-error", {
        title: "Error",
        message: "Failed to load feedback form. Please try again later.",
      });
    }
  }

  // NEW: Submit feedback from email link (no authentication required)
  async submitEmailFeedback(req, res) {
    try {
      const { bookingId } = req.params;
      const { rating, comment, token } = req.body;

      console.log("Email feedback submission:", { bookingId, rating });

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.render("feedback/feedback-error", {
          title: "Error",
          message: "Booking not found.",
        });
      }

      // Validate token
      if (booking.feedbackToken !== token) {
        return res.render("feedback/feedback-error", {
          title: "Invalid Link",
          message: "This feedback link is invalid or has expired.",
        });
      }

      // Check if feedback already exists
      const existingFeedback = await Feedback.findOne({ bookingId });
      if (existingFeedback) {
        return res.render("feedback/feedback-thankyou", {
          title: "Feedback Already Submitted",
          message: "Thank you! Your feedback has already been recorded.",
        });
      }

      // Create feedback
      const feedback = new Feedback({
        bookingId,
        userId: booking.customerId,
        technicianId: booking.technicianId,
        rating,
        comment,
      });

      await feedback.save();

      // Update booking
      await Booking.findByIdAndUpdate(bookingId, {
        hasFeedback: true,
        feedbackToken: null, // Clear token after use
      });

      res.render("feedback/feedback-thankyou", {
        title: "Thank You for Your Feedback",
        message:
          "Your feedback has been submitted successfully. Thank you for helping us improve our services!",
      });
    } catch (error) {
      console.error("Email feedback submission error:", error);
      res.render("feedback/feedback-error", {
        title: "Submission Error",
        message: "Failed to submit feedback. Please try again.",
      });
    }
  }
  async requestFeedbackEmail(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("customerId", "name email")
        .populate("technicianId", "name");

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Generate unique feedback token
      const feedbackToken = crypto.randomBytes(32).toString("hex");

      // Update booking with token
      booking.feedbackToken = feedbackToken;
      booking.feedbackEmailSent = true;
      booking.feedbackRequestedAt = new Date();
      await booking.save();

      // Send feedback email
      await sendFeedbackRequestEmail(
        booking.customerId,
        booking,
        booking.technicianId,
        feedbackToken
      );

      console.log(`✅ Feedback email requested for booking ${bookingId}`);
      return true;
    } catch (error) {
      console.error("❌ Feedback email request error:", error);
      throw error;
    }
  }
}

module.exports = new FeedbackController();
