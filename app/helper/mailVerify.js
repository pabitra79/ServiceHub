const transporter = require("../config/emailConfig");
const nodemailer = require("nodemailer");

const sendLoginCredentials = async (user, plainPassword) => {
  try {
    console.log("📧 Starting email sending process...");

    const websiteName = "Service Management";
    const loginUrl = "http://localhost:5000/login";

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${websiteName}" <${fromEmail}>`,
      to: user.email,
      subject: `Your ${websiteName} Login Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${websiteName}!</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          
          <p>Your manager account has been created. Here are your login details:</p>
          
          <div style="background: #b5c3d0ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Login Page:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #eee; padding: 5px 10px; border-radius: 3px; font-weight: bold;">${plainPassword}</code></p>
          </div>
          
          <p><strong>Security Note:</strong> Please change your password after first login.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Dashboard</a>
          </div>
        </div>
      `,
    };

    console.log(" Sending email now...");
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!", result);
    return true;
  } catch (err) {
    console.error("EMAIL SENDING FAILED!");
    throw err;
  }
};

const sendVerificationEmail = async (user, verificationUrl) => {
  try {
    const websiteName = "Service Management";
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${websiteName}" <${fromEmail}>`,
      to: user.email,
      subject: `Verify Your Email - ${websiteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          
          <p>Thank you for registering with ${websiteName}. Please verify your email address to activate your account.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>Click the button below to verify your email:</strong></p>
            <a href="${verificationUrl}" 
              style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">
              Verify Email Address
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">
              This link will expire in 24 hours.
            </p>
          </div>
          
          <p>If the button doesn't work, copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(" Verification email sent successfully!");
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error(" Verification email failed:", err);
    return { success: false, error: err.message };
  }
};
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetLink = `${
      process.env.EMAIL_LINK || "http://localhost:5000"
    }/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      suject: "password reset Request - ServiceHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the link below to reset your password:</p>
          <a href="${resetLink}" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>ServiceHub Team</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent to:", user.email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};
const sendFeedbackRequestEmail = async (
  customer,
  booking,
  technician,
  feedbackToken
) => {
  try {
    const websiteName = "ServiceHub";
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    // ✅ FIX: Change from /bookings/feedback to /feedback/email
    const feedbackLink = `${
      process.env.BASE_URL || "http://localhost:5000"
    }/feedback/email/${booking._id}?token=${feedbackToken}`;
    const dashboardLink = `${
      process.env.BASE_URL || "http://localhost:5000"
    }/user/dashboard`;

    const mailOptions = {
      from: `"${websiteName}" <${fromEmail}>`,
      to: customer.email,
      subject: `How was your service experience? - ${websiteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>ServiceHub</h1>
            <h2>How was your service experience?</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <p>Hello <strong>${customer.name}</strong>,</p>
            
            <p>Your service with <strong>${
              technician.name
            }</strong> has been completed. We'd love to hear about your experience!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
              <h3 style="color: #333; margin-top: 0;">Service Details:</h3>
              <p><strong>Service Type:</strong> ${booking.serviceType}</p>
              <p><strong>Technician:</strong> ${technician.name}</p>
              <p><strong>Completed On:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackLink}" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                 Share Your Feedback
              </a>
            </div>

            <p>Or provide feedback directly from your dashboard:</p>
            <div style="text-align: center;">
              <a href="${dashboardLink}" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; 
                        border-radius: 5px; display: inline-block;">
                 Go to Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This feedback helps us improve our services and recognize our best technicians.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `,
    };

    const transporter = require("../config/emailConfig");
    await transporter.sendMail(mailOptions);
    console.log(`✅ Feedback email sent to ${customer.email}`);
    console.log(`✅ Feedback link: ${feedbackLink}`); // Debug log
    return true;
  } catch (error) {
    console.error("❌ Feedback email error:", error);
    throw error;
  }
};

module.exports = {
  sendLoginCredentials,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendFeedbackRequestEmail,
};
