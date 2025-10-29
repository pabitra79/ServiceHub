const Manager = require("../model/mangerSchema");
const jwt = require("jsonwebtoken");
const { sendLoginCredentials } = require("../helper/mailVerify");
const hashPassword = require("../helper/hassedpassword");
const { generateRandomPassword } = require("../helper/passwordHelper");
const User = require("../model/userSchema");
const Booking = require("../model/bookingSchema");
const mongoose = require("mongoose");
const statuscode = require("../helper/statusCode");
const uploadImageToCloudnary = require("../helper/cloudinary");
const PasswordResetHelper = require("../helper/passwordResetHelper");
class ManagerController {
  async managerDashboard(req, res) {
    try {
      console.log("===== manager dashboard access ===");

      // Token verification
      const token = req.cookies.managertoken;
      if (!token) {
        return res.redirect("/login");
      }

      if (
        !req.user ||
        (req.user.role !== "manager" && req.user.role !== "admin")
      ) {
        console.log("Unauthorized manager access attempt");
        return res.redirect("/login");
      }

      const managerData = await Manager.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
          },
        },
        {
          $project: {
            _id: 1,
            department: 1,
            isActive: 1,
            createdAt: 1,
            "userDetails._id": 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
            "userDetails.phone": 1,
            "userDetails.role": 1,
            "userDetails.userImage": 1,
          },
        },
      ]);

      const manager = managerData[0];

      if (!manager) {
        return res.redirect("/login");
      }

      const user = manager.userDetails;

      // Get users and technicians
      const users = await User.find({ role: "user" })
        .select("-password")
        .limit(10)
        .sort({ createdAt: -1 });

      const technicians = await User.find({ role: "technician" })
        .select("-password")
        .limit(10)
        .sort({ createdAt: -1 });

      // Get different booking categories
      const pendingAssignmentBookings = await Booking.find({
        status: "pending-manager-assignment",
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const assignedBookings = await Booking.find({
        status: "assigned",
      })
        .sort({ assignedDate: -1 })
        .limit(5)
        .lean();

      const inProgressBookings = await Booking.find({
        status: "in-progress",
      })
        .sort({ workStartedAt: -1 })
        .limit(5)
        .lean();

      const completedBookings = await Booking.find({
        status: "completed",
        workCompletedAt: {
          $gte: new Date().setHours(0, 0, 0, 0), // Today's completed bookings
        },
      })
        .sort({ workCompletedAt: -1 })
        .limit(5)
        .lean();

      // Counts for stats
      const pendingAssignmentsCount = await Booking.countDocuments({
        status: "pending-manager-assignment",
      });

      const assignedCount = await Booking.countDocuments({
        status: "assigned",
      });

      const inProgressCount = await Booking.countDocuments({
        status: "in-progress",
      });

      const completedTodayCount = await Booking.countDocuments({
        status: "completed",
        workCompletedAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
        },
      });

      const totalUsersCount = await User.countDocuments({ role: "user" });
      const totalTechniciansCount = await User.countDocuments({
        role: "technician",
      });

      console.log("Rendering dashboard for:", user.email, "Role:", user.role);

      res.render("manager/dashboard", {
        title: "Manager Dashboard - ServiceHub",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: manager.department,
          userImage: user.userImage,
        },
        users: users,
        technicians: technicians,

        // Different booking categories
        pendingAssignmentBookings: pendingAssignmentBookings,
        assignedBookings: assignedBookings,
        inProgressBookings: inProgressBookings,
        completedBookings: completedBookings,

        stats: {
          totalUsers: totalUsersCount,
          totalTechnicians: totalTechniciansCount,
          pendingAssignments: pendingAssignmentsCount,
          assignedBookings: assignedCount,
          inProgressBookings: inProgressCount,
          completedToday: completedTodayCount,
        },
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Manager dashboard error:", error.message);
      req.flash("error", "Failed to load dashboard");
      res.redirect("/login");
    }
  }

  async showAddManagerForm(req, res) {
    const temporaryPassword = generateRandomPassword();

    try {
      // Define department options for the form
      const departmentOptions = [
        { value: "Operations", label: "Operations" },
        { value: "Sales", label: "Sales" },
        { value: "HR", label: "HR" },
        { value: "Finance", label: "Finance" },
        { value: "IT", label: "IT" },
      ];

      res.render("manager/add-manager", {
        title: "Add New Manager",
        messages: req.flash(),
        temporaryPassword: temporaryPassword,
        departmentOptions: departmentOptions,
        // Add these default empty values for form fields
        formData: {
          name: "",
          email: "",
          phone: "",
          gender: "",
          address: "",
          department: "",
        },
      });
    } catch (err) {
      console.log(err);
      req.flash("error", "Error loading form");
      res.redirect("/admin/dashboard");
    }
  }

  async createManager(req, res) {
    try {
      const { name, email, phone, department, gender, address } = req.body;

      console.log("=== CREATE MANAGER STARTED ===");
      console.log("Form data received:", {
        name,
        email,
        phone,
        department,
        gender,
        address,
      });

      // Validate required fields
      if (!name || !email || !phone || !department || !address || !gender) {
        console.log("❌ Validation failed: Missing required fields");
        req.flash("error", "All fields are required");
        return res.redirect("/admin/dashboard");
      }

      // ✅ Normalize department to match schema enum
      const departmentMap = {
        operations: "Operations",
        sales: "Sales",
        hr: "HR",
        finance: "Finance",
        it: "IT",
      };

      const normalizedDepartment = departmentMap[department.toLowerCase()];

      if (!normalizedDepartment) {
        console.log("❌ Invalid department:", department);
        req.flash("error", "Please select a valid department");
        return res.redirect("/admin/dashboard");
      }

      console.log(
        "✅ Department normalized:",
        department,
        "→",
        normalizedDepartment
      );

      // Check if user already exists
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        console.log("❌ User already exists:", email);
        req.flash("error", "User with this email already exists");
        return res.redirect("/admin/dashboard");
      }

      const temporaryPassword = generateRandomPassword();
      console.log("🔑 Temporary password generated:", temporaryPassword);

      const hashedPassword = await hashPassword(temporaryPassword);
      console.log("🔒 Password hashed successfully");

      // Get creator info
      let createdById = req.user?.userId;
      let createdByRole = req.user?.role || "admin";

      if (!createdById) {
        const adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
          console.log("❌ No admin user found");
          req.flash("error", "System error: No admin found");
          return res.redirect("/admin/dashboard");
        }
        createdById = adminUser._id;
      }

      console.log("👤 Creator:", { id: createdById, role: createdByRole });

      // Handle image upload
      let imageUrl = "";
      if (req.file) {
        try {
          console.log("📸 Uploading image to Cloudinary...");
          imageUrl = await uploadImageToCloudnary(req.file);
          console.log("✅ Image uploaded:", imageUrl);
        } catch (uploadError) {
          console.error("❌ Image upload failed:", uploadError);
          req.flash("error", "Failed to upload image");
          return res.redirect("/admin/dashboard");
        }
      }

      // CREATE USER
      console.log("🔵 Creating user document...");
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role: "manager",
        gender: gender,
        address: address.trim(),
        userImage: imageUrl || "",
        isVerified: true,
      });

      console.log("💾 Saving user to database...");
      const savedUser = await newUser.save();
      console.log("✅ User saved with ID:", savedUser._id);

      // CREATE MANAGER
      console.log("🔵 Creating manager document...");
      const newManager = new Manager({
        department: normalizedDepartment, // Use normalized department
        isActive: true,
        createdBy: createdById,
        createdByRole: createdByRole,
        userId: savedUser._id,
      });

      console.log("Manager data to save:", {
        department: newManager.department,
        isActive: newManager.isActive,
        createdBy: newManager.createdBy,
        createdByRole: newManager.createdByRole,
        userId: newManager.userId,
      });

      console.log("💾 Saving manager to database...");
      const savedManager = await newManager.save();
      console.log("✅ Manager saved with ID:", savedManager._id);

      // VERIFY SAVES
      console.log("🔍 Verifying data was saved...");
      const verifyUser = await User.findById(savedUser._id);
      const verifyManager = await Manager.findById(savedManager._id).populate(
        "userId"
      );

      console.log(
        "User verification:",
        verifyUser ? "✅ Found" : "❌ Not found"
      );
      console.log(
        "Manager verification:",
        verifyManager ? "✅ Found" : "❌ Not found"
      );

      if (!verifyUser || !verifyManager) {
        console.error("❌ CRITICAL ERROR: Data not properly saved!");
        console.error("User exists:", !!verifyUser);
        console.error("Manager exists:", !!verifyManager);
        req.flash("error", "Error: Data not saved properly. Please try again.");

        // Cleanup if one failed
        if (verifyUser && !verifyManager) {
          await User.findByIdAndDelete(savedUser._id);
          console.log("🧹 Cleaned up orphaned user record");
        }

        return res.redirect("/admin/dashboard");
      }

      console.log("✅ Both records verified in database");
      console.log(
        "Manager full document:",
        JSON.stringify(verifyManager, null, 2)
      );

      // Send email
      try {
        console.log("📧 Sending login credentials email...");
        await sendLoginCredentials(savedUser, temporaryPassword, "manager");
        console.log("✅ Email sent successfully");
      } catch (emailError) {
        console.error("⚠️ Email failed (non-critical):", emailError.message);
      }

      console.log("=== CREATE MANAGER COMPLETED SUCCESSFULLY ===");
      req.flash(
        "success",
        `Manager ${savedUser.name} created successfully. Login credentials sent to email.`
      );

      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("❌ CREATE MANAGER ERROR:", err.message);
      console.error("Stack trace:", err.stack);

      // Detailed error logging
      if (err.name === "ValidationError") {
        console.error("Validation errors:", err.errors);
        const errorMessages = Object.values(err.errors)
          .map((e) => e.message)
          .join(", ");
        req.flash("error", `Validation error: ${errorMessages}`);
      } else if (err.code === 11000) {
        console.error("Duplicate key error:", err.keyPattern);
        req.flash("error", "User with this email already exists");
      } else {
        req.flash("error", `Error creating manager: ${err.message}`);
      }

      res.redirect("/admin/dashboard");
    }
  }

  async getAllManagers(req, res) {
    try {
      const managers = await Manager.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: {
            path: "$userData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            department: 1,
            isActive: 1,
            lastLogin: 1,
            createdAt: 1,
            "userData._id": 1,
            "userData.name": 1,
            "userData.email": 1,
            "userData.phone": 1,
            "userData.role": 1,
            "userData.userImage": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      res.render("admin/dashboard", {
        title: "Admin Dashboard",
        managers: managers,
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
        // Pass empty form data
        name: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        department: "",
        temporaryPassword: generateRandomPassword(),
      });
    } catch (err) {
      console.log(err);
      req.flash("error", "Error fetching managers");
      res.redirect("/admin/dashboard");
    }
  }

  async getManagerDetails(req, res) {
    try {
      const { managerId } = req.params;

      if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
        req.flash("error", "Invalid Manager ID");
        return res.redirect("/admin/managers-list");
      }

      const [manager] = await Manager.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(managerId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            department: 1,
            isActive: 1,
            lastLogin: 1,
            createdAt: 1,
            "userDetails._id": 1,
            "userDetails.name": 1,
            "userDetails.email": 1,
            "userDetails.phone": 1,
            "userDetails.role": 1,
            "userDetails.userImage": 1,
            "userDetails.address": 1,
            "userDetails.gender": 1,
            "createdByDetails.name": 1,
            "createdByDetails.email": 1,
          },
        },
      ]);

      if (!manager) {
        req.flash("error", "Manager not found");
        return res.redirect("/admin/managers-list");
      }

      res.render("manager/manager-details", {
        title: "Manager Details",
        manager: manager,
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Get manager details error:", error);
      req.flash("error", "Error fetching manager details");
      res.redirect("/admin/managers-list");
    }
  }

  async deactivateManager(req, res) {
    try {
      const { managerId } = req.params;

      if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
        req.flash("error", "Invalid Manager ID");
        return res.redirect("/admin/dashboard"); // ✅ Changed
      }

      const manager = await Manager.findById(managerId);

      if (!manager) {
        req.flash("error", "Manager not found");
        return res.redirect("/admin/dashboard"); // ✅ Changed
      }

      await Manager.findByIdAndUpdate(managerId, { isActive: false });
      await User.findByIdAndUpdate(manager.userId, { isVerified: false });

      req.flash("success", "Manager deactivated successfully");
      res.redirect("/admin/dashboard"); // ✅ Changed
    } catch (error) {
      console.error("Deactivate manager error:", error);
      req.flash("error", "Error deactivating manager");
      res.redirect("/admin/dashboard"); // ✅ Changed
    }
  }

  async deleteManager(req, res) {
    try {
      const { managerId } = req.params;

      if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
        req.flash("error", "Invalid Manager ID");
        return res.redirect("/admin/managers-list");
      }

      const manager = await Manager.findById(managerId);

      if (!manager) {
        req.flash("error", "Manager not found");
        return res.redirect("/admin/managers-list");
      }

      await Manager.findByIdAndDelete(managerId);
      await User.findByIdAndDelete(manager.userId);

      req.flash("success", "Manager deleted successfully");
      res.redirect("/admin/managers-list");
    } catch (error) {
      console.error("Delete manager error:", error);
      req.flash("error", "Error deleting manager");
      res.redirect("/admin/managers-list");
    }
  }
  async managerLogout(req, res) {
    try {
      console.log("Manager logout requested by:", req.user?.email);
      res.clearCookie("managertoken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      req.flash("success", "Manager logged out successfully");
      res.redirect("/login");
    } catch (error) {
      console.error("Manager logout error:", error);
      res.redirect("/manager/dashboard");
    }
  }
}

module.exports = new ManagerController();
