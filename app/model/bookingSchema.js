const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Customer details
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
      required: false,
    },
    technicianName: {
      type: String,
      required: false,
    },
    technicianSpecialization: {
      type: String,
      required: false,
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

    // Booking status
    status: {
      type: String,
      enum: [
        "pending-manager-assignment", // Needs technician assignment
        "assigned", // Assigned to technician
        "in-progress", // Work started
        "completed", // Work finished
        "cancelled", // Cancelled
        "rejected", // Rejected by manager
      ],
      default: "pending-manager-assignment",
    },

    // Assignment details
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    assignmentType: {
      type: String,
      enum: ["manager", "auto", "customer"],
      default: "manager",
    },

    assignedByName: {
      type: String,
      required: false,
    },

    assignedDate: {
      type: Date,
      required: false,
    },

    // Manager approval fields
    managerApprovedAt: {
      type: Date,
      required: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },

    // Work timestamps
    workStartedAt: {
      type: Date,
      required: false,
    },

    workCompletedAt: {
      type: Date,
      required: false,
    },

    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Feedback
    hasFeedback: {
      type: Boolean,
      default: false,
    },
    // feedback schmea
    feedbackStatus: {
      type: String,
      enum: ["pending", "submitted", "not-requested"],
      default: "not-requested",
    },
    feedbackToken: {
      type: String,
      default: null,
    },
    feedbackRequestedAt: {
      type: Date,
      default: null,
    },
    // ADD THIS: Assignment history
    assignmentHistory: [
      {
        technicianId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        technicianName: String,
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        assignedByName: String,
        assignedDate: Date,
        status: String,
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
