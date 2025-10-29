const Booking = require("../model/bookingSchema");
const Feedback = require("../model/feedbackSchema"); // your existing feedback model
const User = require("../model/userSchema");
const { sendFeedbackRequestEmail } = require("../helper/mailVerify"); // We'll add this
const crypto = require("crypto");

class FeedbackService {
  // Generate unique feedback token
  generateFeedbackToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // Send feedback request when technician completes booking
  async requestFeedback(bookingId, technicianId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const customer = await User.findById(booking.customerId);
      const technician = await User.findById(technicianId);

      // Generate feedback token
      const feedbackToken = this.generateFeedbackToken();

      // Update booking with feedback request
      booking.feedbackStatus = "pending";
      booking.feedbackToken = feedbackToken;
      booking.feedbackRequestedAt = new Date();
      await booking.save();

      // Send feedback request email
      await this.sendFeedbackEmail(
        customer,
        booking,
        technician,
        feedbackToken
      );

      console.log(`Feedback request sent for booking ${bookingId}`);
      return true;
    } catch (error) {
      console.error("Error requesting feedback:", error);
      throw error;
    }
  }

  // Send feedback email
  async sendFeedbackEmail(customer, booking, technician, feedbackToken) {
    const feedbackLink = `${
      process.env.BASE_URL || "http://localhost:5000"
    }/bookings/feedback/${booking._id}?token=${feedbackToken}`;
    const dashboardLink = `${
      process.env.BASE_URL || "http://localhost:5000"
    }/user/dashboard`;

    const mailOptions = {
      from: `"ServiceHub" <${process.env.EMAIL_FROM}>`,
      to: customer.email,
      subject: `How was your service experience? - ServiceHub`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>ServiceHub</h1>
            <h2>How was your service experience?</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <p>Hello <strong>${customer.name}</strong>,</p>
            
            <p>Your service with <strong>${
              technician.name
            }</strong> has been completed. We'd love to hear about your experience!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
              <h3 style="color: #333; margin-top: 0;">Service Details:</h3>
              <p><strong>Service Type:</strong> ${booking.serviceType}</p>
              <p><strong>Technician:</strong> ${technician.name}</p>
              <p><strong>Completed On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackLink}" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                 Share Your Feedback
              </a>
            </div>

            <p>Or provide feedback directly from your dashboard:</p>
            <div style="text-align: center;">
              <a href="${dashboardLink}" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; 
                        border-radius: 5px; display: inline-block;">
                 Go to Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This feedback helps us improve our services and recognize our best technicians.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `,
    };

    // Use your existing email transporter
    const transporter = require("../config/emailConfig");
    await transporter.sendMail(mailOptions);
  }

  // Submit feedback (from email link or dashboard)
  async submitFeedback(bookingId, userId, rating, comment, token = null) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Validate token if provided (for email links)
      if (token && booking.feedbackToken !== token) {
        throw new Error("Invalid feedback token");
      }

      // Check if user is authorized
      if (booking.customerId.toString() !== userId) {
        throw new Error("Not authorized to submit feedback for this booking");
      }

      // Check if feedback already submitted
      const existingFeedback = await Feedback.findOne({ bookingId });
      if (existingFeedback) {
        throw new Error("Feedback already submitted for this booking");
      }

      // Create feedback record using your existing schema
      const feedback = new Feedback({
        bookingId: bookingId,
        userId: userId,
        technicianId: booking.technicianId,
        rating: rating,
        comment: comment,
        status: "active",
      });

      await feedback.save();

      // Update booking status
      booking.feedbackStatus = "submitted";
      booking.feedbackToken = null; // Clear token after use
      await booking.save();

      console.log(`Feedback submitted for booking ${bookingId}`);
      return feedback;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  }

  // Get feedback for a booking
  async getBookingFeedback(bookingId) {
    return await Feedback.findOne({ bookingId })
      .populate("userId", "name email")
      .populate("technicianId", "name specialization");
  }

  // Get all feedback for a technician
  async getTechnicianFeedback(technicianId) {
    return await Feedback.find({ technicianId, status: "active" })
      .populate("userId", "name")
      .populate("bookingId", "serviceType problemDescription")
      .sort({ createdAt: -1 });
  }
}

module.exports = new FeedbackService();
