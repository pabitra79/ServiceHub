const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Customer details (store directly for easy access)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },

    // Technician details
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    technicianName: {
      type: String,
      required: true,
    },
    technicianSpecialization: {
      type: String,
      required: true,
    },

    // Service details
    serviceType: {
      type: String,
      required: true,
      enum: [
        "plumbing",
        "electrical",
        "carpentry",
        "cleaning",
        "painting",
        "other",
      ],
    },

    problemDescription: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Location details
    serviceAddress: {
      type: String,
      required: true,
    },

    // Preferred timing
    preferredDate: {
      type: Date,
      required: true,
    },

    preferredTime: {
      type: String,
      required: true,
    },

    // Booking status flow - UPDATED
    status: {
      type: String,
      enum: [
        "pending-manager-approval", // Customer chose tech, needs manager OK
        "pending-manager-assignment", // Manager needs to assign tech
        "assigned",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "pending-manager-approval",
    },

    // Assignment details - UPDATED
    assignedBy: {
      type: String, // CHANGED: from ObjectId to String to track "customer" or "manager"
      enum: ["customer", "manager", "system"],
      default: "customer",
    },

    assignedByName: {
      type: String,
    },

    assignedDate: {
      type: Date,
    },

    // Manager approval fields - ADD THESE NEW FIELDS
    managerApprovedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    // Work details
    workStartedAt: {
      type: Date,
    },

    workCompletedAt: {
      type: Date,
    },

    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
