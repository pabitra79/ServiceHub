const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userModel = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 12,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 45,
      minlength: 7,
    },
    gender: {
      type: String,
      enum: ["male", "female", "others"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      maxlength: 10,
      minlength: 10,
      match: /^[0-9]{10}$/,
    },
    address: {
      type: String,
      required: true,
      maxlength: 200,
      minlength: 5,
    },
    password: {
      type: String,
      required: true,
      maxlength: 90,
      minlength: 6,
    },
    userImage: {
      type: String,
      default: "",
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "technician", "user"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const UserSchmea = mongoose.model("user", userModel);
module.exports = UserSchmea;
