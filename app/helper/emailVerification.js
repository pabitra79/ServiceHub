// helper/emailVerification.js
const crypto = require("crypto");
const { sendVerificationEmail } = require("./mailVerify");

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const sendEmailVerification = async (user) => {
  try {
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token to user
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    user.isVerified = false;
    await user.save();

    // Send verification email
    const verificationUrl = `http://localhost:5000/verify-email?token=${verificationToken}`;

    const emailResult = await sendVerificationEmail(user, verificationUrl);
    return emailResult;
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
};

module.exports = { sendEmailVerification, generateVerificationToken };
