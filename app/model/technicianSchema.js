const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema(
  {
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      enum: [
        "plumbing",
        "electrical",
        "carpentry",
        "cleaning",
        "painting",
        "other",
      ],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
    },
    skills: [
      {
        type: String,
      },
    ],
    serviceAreas: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "manager"],
      default: "admin",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // add extra for
    availability: {
      type: String,
      enum: ["available", "busy", "on-leave"],
      default: "available",
    },
    currentWorkload: {
      type: Number,
      default: 0,
    },
    maxWorkload: {
      type: Number,
      default: 5, // Maximum simultaneous jobs
    },
  },
  { timestamps: true }
);

const Technician = mongoose.model("Technician", technicianSchema);
module.exports = Technician;
