const joi = require("joi");
const { Schmea } = require("mongoose");

const createFeedback = () => {
  const Schema = joi.object({
    bookingId: joi.string().required().messages({
      "any.required": "Booking ID is required",
    }),

    rating: joi.number().integer().min(1).max(5).required().messages({
      "number.minlength": "Rating must be at least 1",
      "number.maxlength": "Rating cannot exceed 5",
      "any.required": "Rating is required",
    }),

    comment: joi.string().max(500).optional().messages({
      "string.max": "Comment cannot exceed 500 characters",
    }),
  });
  return Schema;
};

module.exports = { createFeedback };
