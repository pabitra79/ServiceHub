const joi = require("joi");

const registerSchema = () => {
  const Schmea = joi.object({
    name: joi.string().min(2).max(50).required().messages({
      "string.minlength": "Name must be at least 2 characters",
      "string.maxlength": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),

    email: joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Email is required",
    }),

    phone: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone must be exactly 10 digits",
        "any.required": "Phone is required",
      }),

    address: joi.string().min(5).max(200).required().messages({
      "string.minlength": "Address must be at least 5 characters",
      "any.required": "Address is required",
    }),

    password: joi.string().min(6).max(50).required().messages({
      "string.minlength": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),

    role: joi.string().valid("user").optional(),
  });
  return Schmea;
};

const loginSchema = () => {
  const Schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });
  return Schema;
};

const verifyOtpSchema = () => {
  const Schema = joi.object({
    userId: joi.string().required(),
    otp: joi.string().length(4).required().messages({
      "string.length": "OTP must be 4 digits",
    }),
  });
  return Schema;
};

module.exports = { registerSchema, loginSchema, verifyOtpSchema };
