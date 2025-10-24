const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const Manager = require("../model/mangerSchema");
const Booking = require("../model/bookingSchema");
const UserValidation = require("../validators/userValidators");
const statuscode = require("../helper/statusCode");
const uploadImageToCloudnary = require("../helper/cloudinary");
const hassesPassword = require("../helper/hassedpassword");
const generationToken = require("../helper/jsonwebtoken");
const bcryptjs = require("bcryptjs");
const { sendEmailVerification } = require("../helper/emailVerification");
const PasswordResetHelper = require("../helper/passwordResetHelper");

class UserController {
  // =REGISTER VIEW ==
  async RegisterView(req, res) {
    try {
      res.render("register", {
        title: "Register - Service Management",
        error: null,
        success: null,
      });
    } catch (err) {
      res
        .status(statuscode.NOT_FOUND)
        .render("error", { message: err.message });
    }
  }

  // = REGISTER CREATE =
  async register(req, res) {
    try {
      console.log("Request body:", req.body);
      const { name, email, gender, phone, address, password, confirmPassword } =
        req.body;

      // Validate with Joi
      const { error, value } = UserValidation.registerValidation({
        name,
        email,
        gender,
        phone,
        address,
        password,
        confirmPassword,
      });

      // Check validation errors - SHOW DETAILED ERRORS
      if (error) {
        console.error("Full Validation Error Details:", error.details);
        const message =
          error.details.map((detail) => detail.message).join(", ") ||
          "Validation failed";
        console.error("Validation Error Messages:", message);
        return res.status(statuscode.BAD_REQUEST).render("register", {
          title: "Register - Service Management",
          error: message,
          success: null,
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: value.email });
      if (existingUser) {
        console.log("User already exists");
        return res.status(statuscode.BAD_REQUEST).render("register", {
          title: "Register - Service Management",
          error: "Email already registered",
          success: null,
        });
      }

      // Upload image to Cloudinary if provided
      let imageUrl = "";
      if (req.file) {
        try {
          console.log("Uploading image to Cloudinary...");
          imageUrl = await uploadImageToCloudnary(req.file);
          console.log("Image uploaded:", imageUrl);
        } catch (uploadError) {
          console.error("Upload Error:", uploadError);
          return res.status(statuscode.BAD_REQUEST).render("register", {
            title: "Register - Service Management",
            error: "Failed to upload image",
            success: null,
          });
        }
      }

      // Hash password
      const hashedPassword = await hassesPassword(value.password);

      // Create new user
      const newUser = new User({
        name: value.name,
        email: value.email,
        gender: value.gender,
        phone: value.phone,
        address: value.address,
        password: hashedPassword,
        userImage: imageUrl || "",
        role: "user",
        isVerified: false,
      });

      // Save to database
      await newUser.save();
      console.log("User saved successfully:", newUser._id);

      // Send verification email
      try {
        await sendEmailVerification(newUser);
        console.log("Verification email sent to:", newUser.email);

        // Show success message but indicate verification is needed
        req.flash(
          "success",
          "Registration successful! Please check your email to verify your account."
        );

        // Redirect to login with verification message
        return res.redirect("/login?message=verify-email");
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // If email fails, delete the user and show error
        await User.findByIdAndDelete(newUser._id);
        return res.status(statuscode.INTERNAL_SERVER_ERROR).render("register", {
          title: "Register - Service Management",
          error:
            "Failed to send verification email. Please try again with a valid email address.",
          success: null,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(statuscode.INTERNAL_SERVER_ERROR).render("register", {
        title: "Register - Service Management",
        error: "Registration failed. Please try again.",
        success: null,
      });
    }
  }

  // ==================== EMAIL VERIFICATION ====================
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).render("error", {
          title: "Verification Failed",
          message: "Invalid verification link",
        });
      }

      // Find user with valid token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).render("error", {
          title: "Verification Failed",
          message:
            "Invalid or expired verification link. Please request a new one.",
        });
      }

      // Verify the user
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      req.flash("success", "Email verified successfully! You can now login.");
      res.redirect("/login?success=verified");
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).render("error", {
        title: "Verification Error",
        message: "Email verification failed. Please try again.",
      });
    }
  }

  // ==================== RESEND VERIFICATION EMAIL ====================
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        req.flash("error", "Email is required.");
        return res.redirect("/login");
      }

      const user = await User.findOne({ email, isVerified: false });

      if (!user) {
        req.flash("error", "User not found or already verified.");
        return res.redirect("/login");
      }

      // Check if previous token is still valid (prevent spam)
      if (
        user.emailVerificationExpires &&
        user.emailVerificationExpires > Date.now()
      ) {
        const timeLeft = Math.round(
          (user.emailVerificationExpires - Date.now()) / (60 * 1000)
        );
        req.flash(
          "error",
          `Please wait ${timeLeft} minutes before requesting a new verification email.`
        );
        return res.redirect("/login");
      }

      await sendEmailVerification(user);

      req.flash("success", "Verification email sent! Please check your inbox.");
      res.redirect("/login?message=verification-resent");
    } catch (error) {
      console.error("Resend verification error:", error);
      req.flash("error", "Failed to resend verification email.");
      res.redirect("/login");
    }
  }

  // ==================== VERIFICATION PROMPT PAGE ====================
  async verificationPrompt(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.redirect("/login");
      }

      res.render("verification-prompt", {
        title: "Verify Your Email - Service Management",
        email: email,
        error: null,
        success: null,
      });
    } catch (error) {
      console.error("Verification prompt error:", error);
      res.redirect("/login");
    }
  }

  // ==================== LOGIN VIEW ====================
  async loginView(req, res) {
    try {
      // Check for verification messages
      let success = null;
      let error = null;
      let unverifiedEmail = null;

      if (req.query.message === "verify-email") {
        success =
          "Registration successful! Please check your email to verify your account.";
      } else if (req.query.success === "verified") {
        success = "Email verified successfully! You can now login.";
      } else if (req.query.message === "verification-resent") {
        success = "Verification email sent! Please check your inbox.";
      }

      res.render("login", {
        title: "Login - Service Management",
        error: error || req.flash("error")[0] || null,
        success: success || req.flash("success")[0] || null,
        unverifiedEmail: unverifiedEmail,
      });
    } catch (error) {
      res.status(500).render("error", {
        title: "Login Error",
        message: error.message,
      });
    }
  }

  // ==================== LOGIN ====================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        req.flash("error", "Email and password are required");
        return res.redirect("/login");
      }

      // Validate with Joi
      const { error, value } = UserValidation.loginValidation({
        email,
        password,
      });

      if (error) {
        req.flash("error", "Login failed");
        return res.status(statuscode.BAD_REQUEST).render("login", {
          title: "Login - Service Management",
          error: error.details[0].message,
          success: null,
        });
      }

      // Find user by email
      const user = await User.findOne({ email: value.email });

      if (!user) {
        req.flash("error", "Invalid email or password");
        return res.status(401).render("login", {
          title: "Login - Service Management",
          error: "Invalid email or password",
          success: null,
        });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(401).render("login", {
          title: "Login - Service Management",
          error: "Please verify your email address before logging in.",
          success: null,
          unverifiedEmail: user.email, // Pass email for resend functionality
        });
      }

      // For managers, we need to check if they're active in the Manager collection
      if (user.role === "manager") {
        const manager = await Manager.findOne({ userId: user._id });

        if (!manager || !manager.isActive) {
          req.flash("error", "Manager account is deactivated or not found");
          return res.status(401).render("login", {
            title: "Login - Service Management",
            error: "Account is deactivated. Please contact administrator.",
            success: null,
          });
        }
      }

      // Compare password
      const isPasswordValid = await bcryptjs.compare(
        value.password,
        user.password
      );

      if (!isPasswordValid) {
        req.flash("error", "Invalid email or password");
        return res.status(statuscode.UNAUTHORIZED).render("login", {
          title: "Login - Service Management",
          error: "Invalid email or password",
          success: null,
        });
      }

      // Generate token
      const token = generationToken({
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      });

      // Only set ONE cookie based on role
      if (user.role === "user") {
        res.clearCookie("usertoken", { path: "/" });
        res.cookie("usertoken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      } else if (user.role === "admin") {
        res.clearCookie("admintoken", { path: "/" });
        res.cookie("admintoken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          maxAge: 60 * 60 * 1000,
          path: "/",
        });
      } else if (user.role === "technician") {
        res.clearCookie("techniciantoken", { path: "/" });
        res.cookie("techniciantoken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      } else if (user.role === "manager") {
        res.clearCookie("managertoken", { path: "/" });
        res.cookie("managertoken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }

      console.log(`${user.role.toUpperCase()} login successful: ${user.email}`);

      // Update last login for manager
      if (user.role === "manager") {
        await Manager.findOneAndUpdate(
          { userId: user._id },
          { lastLogin: new Date() }
        );
      }

      // Redirect based on role
      const dashboardRoutes = {
        user: "/user/dashboard",
        technician: "/technician/dashboard",
        manager: "/manager/dashboard",
        admin: "/admin/dashboard",
      };

      req.flash("success", `Welcome back, ${user.name}!`);
      res.redirect(dashboardRoutes[user.role] || "/user/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      res.status(statuscode.SERVICE_UNAVAILABLE).render("login", {
        title: "Login - Service Management",
        error: "Login failed. Please try again.",
        success: null,
      });
    }
  }

  // ==================== USER DASHBOARD ====================
  async userDashboard(req, res) {
    try {
      console.log("=== DASHBOARD ACCESS ATTEMPT ===");
      console.log("user from middleware:", req.user);
      console.log("Cookies:", req.cookies);

      // req.user is set by requireUser middleware
      if (!req.user || req.user.role !== "user") {
        console.log("Unauthorized user access attempt");
        return res.redirect("/login");
      }

      // Get token from cookies
      const token = req.cookies.usertoken;
      console.log("Token exists:", !!token);

      if (!token) {
        console.log("No token found - redirecting to login");
        return res.redirect("/login");
      }

      // Verify token
      console.log("Verifying token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      // Find user
      const user = await User.findById(decoded.userId);
      console.log("User found:", user ? user.email : "NO USER FOUND");

      if (!user) {
        console.log("User not found in database - redirecting to login");
        return res.redirect("/login");
      }

      // Get user's bookings for stats
      const userBookings = await Booking.find({ customerId: user._id });

      // Calculate real stats
      const stats = {
        pending: userBookings.filter((b) =>
          [
            "pending",
            "pending-manager-approval",
            "pending-manager-assignment",
          ].includes(b.status)
        ).length,
        inProgress: userBookings.filter((b) => b.status === "in-progress")
          .length,
        completed: userBookings.filter((b) => b.status === "completed").length,
        total: userBookings.length,
      };

      // Get recent services (last 5 bookings)
      const recentServices = await Booking.find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "serviceType problemDescription status createdAt technicianName"
        )
        .lean(); // Convert to plain objects

      console.log("Real stats:", stats);
      console.log("Recent services:", recentServices.length);

      // Render dashboard with REAL data
      res.render("user/dashboard", {
        title: "User Dashboard - ServiceHub",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userImage: user.userImage,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
        stats: stats,
        recentServices: recentServices,
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error.message);
      req.flash("error", "Failed to load dashboard");
      res.redirect("/login");
    }
  }

  // ==================== LOGOUT ====================
  async logout(req, res) {
    try {
      res.clearCookie("usertoken", {
        path: "/",
        sameSite: "Strict",
      });
      req.flash("success", "User logout successful");
      return res.redirect("/login?success=Logged out successfully");
    } catch (err) {
      console.log(err, "Logout failed");
      req.flash("error", "Logout failed");
      return res.redirect("/login");
    }
  }
  // for univarsal
  async showForgotPassword(req, res) {
    try {
      res.render("forgot-password", {
        title: "Forgot Password - ServiceHub",
        error: req.flash("error")[0] || null,
        success: req.flash("success")[0] || null,
      });
    } catch (error) {
      console.error("Forgot password form error:", error);
      res.redirect("/login");
    }
  }

  // Handle forgot password request (universal)
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        req.flash("error", "Email is required");
        return res.redirect("/forgot-password");
      }

      await PasswordResetHelper.requestPasswordReset(email);

      req.flash("success", "Password reset link sent to your email");
      res.redirect("/forgot-password");
    } catch (error) {
      console.error("Forgot password error:", error);
      req.flash("error", error.message);
      res.redirect("/forgot-password");
    }
  }

  // Show reset password form
  async showResetPassword(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        req.flash("error", "Invalid reset token");
        return res.redirect("/forgot-password");
      }

      res.render("reset-password", {
        title: "Reset Password - ServiceHub",
        token: token,
        error: req.flash("error")[0] || null,
        success: req.flash("success")[0] || null,
      });
    } catch (error) {
      console.error("Reset password form error:", error);
      req.flash("error", "Invalid reset token");
      res.redirect("/forgot-password");
    }
  }

  // Handle reset password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        req.flash("error", "All fields are required");
        return res.redirect(`/reset-password/${token}`);
      }

      if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match");
        return res.redirect(`/reset-password/${token}`);
      }

      if (password.length < 6) {
        req.flash("error", "Password must be at least 6 characters long");
        return res.redirect(`/reset-password/${token}`);
      }

      await PasswordResetHelper.resetPassword(token, password);

      req.flash(
        "success",
        "Password reset successfully. Please login with your new password."
      );
      res.redirect("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      req.flash("error", error.message);
      res.redirect(`/reset-password/${token}`);
    }
  }
}

module.exports = new UserController();
