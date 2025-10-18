const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");
const Manager = require("../model/mangerSchema");
const UserValidation = require("../validators/userValidators");
const statuscode = require("../helper/statusCode");
const uploadImageToCloudnary = require("../helper/cloudinary");
const hassesPassword = require("../helper/hassedpassword");
const generationToken = require("../helper/jsonwebtoken");
const bcryptjs = require("bcryptjs");

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

      // Rest of your code remains the same...
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

      // Generate token
      const token = generationToken({
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      // Set token in cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
      });
      console.log("User registered and logged in:", newUser.email);
      req.flash("success", "Registration successful!");

      // Redirect to USER dashboard
      res.redirect("/user/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      res.status(statuscode.INTERNAL_SERVER_ERROR).render("register", {
        title: "Register - Service Management",
        error: error.message || "Registration failed. Please try again.",
        success: null,
      });
    }
  }

  // ==================== LOGIN VIEW ====================
  async loginView(req, res) {
    try {
      res.render("login", {
        title: "Login - Service Management",
        error: null,
        success: req.query.success || null,
      });
    } catch (error) {
      res.status(500).render("error", { message: error.message });
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
      // ******  // Redirect based on role ///******* */

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

      // FIX: Find user by email since userId might not be in token
      const user = await User.findById(decoded.userId);
      console.log("User found:", user ? user.email : "NO USER FOUND");

      if (!user) {
        console.log("User not found in database - redirecting to login");
        return res.redirect("/login");
      }

      console.log("Rendering dashboard for:", user.email);

      // Render dashboard
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
        stats: {
          pending: 5,
          inProgress: 3,
          completed: 12,
          total: 20,
        },
        recentServices: [], // Empty for now
      });
    } catch (error) {
      console.error("Dashboard error:", error.message);
      res.redirect("/login");
    }
  }
  // home page with 3 technician name with details

  // ==================== USER SERVICES ====================
  // async userServices(req, res) {
  //   try {
  //     const userId = req.user.id;

  //     // Fetch user bookings from database
  //     const user = await User.findById(userId).select("-password");

  //     if (!user) {
  //       return res.status(404).render("error", {
  //         message: "User not found",
  //         status: 404,
  //       });
  //     }

  //     res.render("user/services", {
  //       title: "My Services - ServiceHub",
  //       user: user,
  //       // bookings: bookings
  //     });
  //   } catch (error) {
  //     console.error("Services error:", error);
  //     res.status(500).render("error", {
  //       message: "Failed to load services",
  //       status: 500,
  //     });
  //   }
  // }

  // ==================== BOOK SERVICE VIEW ====================
  // async bookServiceView(req, res) {
  //   try {
  //     const userId = req.user.id;

  //     const user = await User.findById(userId).select("-password");

  //     if (!user) {
  //       return res.status(404).render("error", {
  //         message: "User not found",
  //         status: 404,
  //       });
  //     }

  //     res.render("user/bookService", {
  //       title: "Book Service - ServiceHub",
  //       user: user,
  //     });
  //   } catch (error) {
  //     console.error("Book service error:", error);
  //     res.status(500).render("error", {
  //       message: "Failed to load booking page",
  //       status: 500,
  //     });
  //   }
  // }

  // ==================== LOGOUT ====================

  async logout(req, res) {
    try {
      res.clearCookie("usertoken", {
        path: "/",
        sameSite: "Strict",
      });
      req.flash("success", "User logout successful");
      return res.redirect("/login?success=Logged out successfully"); // FIXED: Added redirect
    } catch (err) {
      console.log(err, "Logout failed");
      req.flash("error", "Logout failed");
      return res.redirect("/login");
    }
  }
}

module.exports = new UserController();
