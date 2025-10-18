const joi = require("joi");

const createBookingSchema = () => {
  const Schema = joi.object({
    serviceType: joi
      .string()
      .valid("Fridge", "TV", "AC", "Bycycle", "Cycle")
      .required()
      .messages({
        "any.only":
          "Service type must be one of: Fridge, TV, AC, Bycycle, Cycle",
        "any.required": "Service type is required",
      }),

    address: joi.string().min(5).max(200).required().messages({
      "string.min": "Address must be at least 5 characters",
      "any.required": "Address is required",
    }),

    phone: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone must be exactly 10 digits",
        "any.required": "Phone is required",
      }),

    scheduleDate: joi.date().min("now").required().messages({
      "date.min": "Schedule date must be in the future",
      "any.required": "Schedule date is required",
    }),
  });
  return Schema;
};

const updateBookingStatusSchema = () => {
  const Schema = joi.object({
    status: joi
      .string()
      .valid("pending", "assigned", "in-progress", "completed", "cancelled")
      .required()
      .messages({
        "any.only": "Invalid status",
        "any.required": "Status is required",
      }),
  });
  return Schema;
};

const assignBookingSchema = () => {
  const Schema = joi.object({
    technicianId: joi.string().required().messages({
      "any.required": "Technician ID is required",
    }),
  });
  return Schema;
};

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  assignBookingSchema,
};
