const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      enum: ["operations", "sales", "hr", "finance", "it"],
      required: [true, "Department is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to Admin/User who created this manager
      required: true,
    },
    createdByRole: {
      // ← ADD THIS FIELD
      type: String,
      enum: ["admin", "manager"],
      default: "admin", // ← Add default value
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

const Manager = mongoose.model("Manager", managerSchema);

module.exports = Manager;
