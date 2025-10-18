// config/emailConfig.js
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

console.log("🔧 Email Configuration:");
console.log("Host:", process.env.EMAIL_HOST);
console.log("Port:", process.env.EMAIL_PORT);
console.log("User:", process.env.EMAIL_USER);
console.log("From:", process.env.EMAIL_FROM);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Add these for better debugging
  debug: true,
  logger: true,
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email transporter ERROR:", error);
  } else {
    console.log("✅ Email transporter is ready to send messages");
  }
});

module.exports = transporter;
