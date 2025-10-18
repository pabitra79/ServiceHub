// helper/mailVerfy.js
const transporter = require("../config/emailConfig");

const sendLoginCredentials = async (user, plainPassword) => {
  try {
    console.log("📧 Starting email sending process...");

    const websiteName = "Service Management";
    const loginUrl = "http://localhost:5000/login";

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    // console.log("From email:", fromEmail);

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

    console.log("🔄 Sending email now...");
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!", result);
    return true;
  } catch (err) {
    console.error(" EMAIL SENDING FAILED!");

    throw err;
  }
};

module.exports = sendLoginCredentials;
