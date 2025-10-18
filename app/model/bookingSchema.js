const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingModel = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["Fridge", "TV", "AC", "Bycycle", "Cycle"],
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "assinged", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 10,
      match: /^[0-9]{10}$/,
    },
    scheduleDate: {
      type: Date,
      required: true,
    },
    bookingImage: {
      type: String,
      default: " ",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const bookingSchema = mongoose.model("booking", bookingModel);
module.exports = bookingSchema;
