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
  },
  { timestamps: true }
);

const Technician = mongoose.model("Technician", technicianSchema);
module.exports = Technician;
