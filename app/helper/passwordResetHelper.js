const crypto = require("crypto");
const User = require("../model/userSchema");
const { sendPasswordResetEmail } = require("./mailVerify");
const hashPassword = require("./hassedpassword");

class PasswordResetHelper {
  static generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  static generateTokenExpiry() {
    return Date.now() + 3600000; // 1 hour
  }

  // Universal password reset for ALL roles
  static async requestPasswordReset(email) {
    try {
      // Find user by email (any role)
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        throw new Error("No account found with this email");
      }

      // Check if user is verified
      if (!user.isVerified) {
        throw new Error(
          "Please verify your email first before resetting password"
        );
      }

      // For managers, check if they're active
      if (user.role === "manager") {
        const Manager = require("../model/mangerSchema");
        const manager = await Manager.findOne({ userId: user._id });
        if (!manager || !manager.isActive) {
          throw new Error("Manager account is deactivated");
        }
      }

      // Generate reset token and expiry
      const resetToken = this.generateResetToken();
      const resetTokenExpiry = this.generateTokenExpiry();

      // Save token to user document
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Send reset email
      await sendPasswordResetEmail(user, resetToken);

      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      // Find user by valid token
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = PasswordResetHelper;
