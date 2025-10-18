const Joi = require("joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(12).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 12 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().min(7).max(45).required().messages({
      "string.email": "Please enter a valid email address",
      "string.min": "Email must be at least 7 characters long",
      "string.max": "Email cannot exceed 45 characters",
      "any.required": "Email is required",
    }),
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be exactly 10 digits",
        "any.required": "Phone number is required",
      }),
    address: Joi.string().min(5).max(200).required().messages({
      "string.min": "Address must be at least 5 characters long",
      "string.max": "Address cannot exceed 200 characters",
      "any.required": "Address is required",
    }),
    password: Joi.string().min(6).max(90).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.max": "Password cannot exceed 90 characters",
      "any.required": "Password is required",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your password",
      }),
    gender: Joi.string().valid("male", "female", "others").required().messages({
      "any.only": "Please select a valid gender",
      "any.required": "Gender is required",
    }),
    userImage: Joi.string().optional(),
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};
// const updatedProfile = () => {
//   const schema = Joi.object({
//     name: Joi.string().min(2).max(12).optional(),
//     email: Joi.string().email().min(7).max(19).optional(),
//     phone: Joi.string()
//       .pattern(/^[0-9]{10}$/)
//       .min(10)
//       .max(10)
//       .optional(),
//     adress: Joi.string().min(5).max(200).optional(),
//     password: Joi.string().min(6).max(18).optional(),
//     userImage: Joi.string().optional(),
//     role: Joi.string()
//       .valid("admin", "manager", "technician", "user")
//       .optional(),
//     isVerified: Joi.boolean().optional(),
//   });
//   return schema;
// };

// const createTechnician = () => {
//   const schema = Joi.object({
//     name: Joi.string().min(2).max(12).required(),
//     email: Joi.string().email().min(7).max(19).required(),
//     phone: Joi.string()
//       .pattern(/^[0-9]{10}$/)
//       .min(10)
//       .max(10)
//       .required(),
//     adress: Joi.string().min(5).max(200).required(),
//     password: Joi.string().min(6).max(18).required(),
//     userImage: Joi.string().optional(),
//     role: Joi.string()
//       .valid("admin", "manager", "technician", "user")
//       .default("technician"),
//     isVerified: Joi.boolean().default(false),
//   });
//   return schema;
// };

module.exports = {
  // updatedProfile,
  loginValidation,
  // createTechnician,
  registerValidation,
};
