const User = require("../model/userSchema");
const Manager = require("../model/mangerSchema");
const jwt = require("jsonwebtoken");
const hashPassword = require("../helper/hassedpassword");
const Technician = require("../model/technicianSchema");
const statuscode = require("../helper/statusCode");

class Admin {
  async adminDashboard(req, res) {
    try {
      console.log("ADMIN DASHBOARD ACCESS");

      if (!req.user || req.user.role !== "admin") {
        console.log("Unauthorized admin access attempt");
        return res.redirect("/login");
      }

      const token = req.cookies.admintoken;
      if (!token) {
        return res.redirect("/login");
      }

      // Removed unnecessary jwt.verify - middleware already verified
      const admin = await User.findById(req.user.userId).select("-password");

      if (!admin) {
        return res.redirect("/login");
      }

      // Get statistics
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalAdmins = await User.countDocuments({ role: "admin" });
      const totalTechnicians = await User.countDocuments({
        role: "technician",
      });
      const totalManagers = await User.countDocuments({ role: "manager" });
      const totalEmployees = totalTechnicians + totalManagers;

      // Fetch regular users
      const users = await User.find({ role: "user" })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

      // Manager aggregation
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
          $addFields: {
            userData: {
              $cond: {
                if: { $gt: [{ $size: "$userData" }, 0] },
                then: { $arrayElemAt: ["$userData", 0] },
                else: {
                  name: "User Not Found",
                  email: "N/A",
                  phone: "N/A",
                  role: "manager",
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            department: 1,
            isActive: 1,
            createdAt: 1,
            "userData._id": 1,
            "userData.name": 1,
            "userData.email": 1,
            "userData.phone": 1,
            "userData.role": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      // Technician aggregation
      const technicians = await Technician.aggregate([
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
            specialization: 1,
            experience: 1,
            skills: 1,
            serviceAreas: 1,
            isActive: 1,
            createdAt: 1,
            "userData._id": 1,
            "userData.name": 1,
            "userData.email": 1,
            "userData.phone": 1,
            "userData.role": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      // Single render with ALL data
      return res.render("admin/dashboard", {
        title: "Admin Dashboard - ServiceHub",
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          userImage: admin.userImage,
        },
        stats: {
          totalUsers,
          totalAdmins,
          totalTechnicians,
          totalManagers,
          totalEmployees,
        },
        managers,
        users,
        technicians,
        messages: req.flash(),
        success: null,
        error: null,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error.message);
      res.redirect("/login");
    }
  }

  async createEmployee(req, res) {
    try {
      const { name, email, password, role, area, phone } = req.body;

      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        req.flash("error", "Only admins can create employees");
        return res.redirect("/admin/dashboard");
      }

      // Validate inputs
      if (!name || !email || !password || !role) {
        req.flash("error", "Name, email, password, and role are required");
        return res.redirect("/admin/create-employee");
      }

      // Check valid role
      const validRoles = ["technician", "manager", "admin"];
      if (!validRoles.includes(role)) {
        req.flash("error", "Invalid role selected");
        return res.redirect("/admin/create-employee");
      }

      // Check if email exists
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingUser) {
        req.flash("error", "Email already registered");
        return res.redirect("/admin/create-employee");
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create employee
      const newEmployee = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        area: area || null,
        phone: phone ? phone.trim() : "",
        isVerified: true,
      });

      await newEmployee.save();

      console.log(`${role} created by admin:`, email);
      req.flash("success", `${role} created successfully`);
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Create employee error:", error.message);
      req.flash("error", "Failed to create employee");
      return res.redirect("/admin/dashboard");
    }
  }

  async getAllUsers(req, res) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(statuscode.FORBIDDEN).json({
          success: false,
          message: "Access Denied - Admin only",
        });
      }

      // Fetch all users except passwords
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: users.length,
        users: users,
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(statuscode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }

  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;

      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(statuscode.FORBIDDEN).json({
          success: false,
          message: "Access Denied - Admin only",
        });
      }

      // Validate role
      const validRoles = ["user", "technician", "manager", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(statuscode.BAD_REQUEST).json({
          success: false,
          message: "Invalid role",
        });
      }

      const users = await User.find({ role })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        role,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error("Get users by role error:", error);
      res.status(statuscode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("admintoken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      if (req.session) {
        req.session.destroy();
      }

      console.log("Admin logout successful");
      return res.redirect("/login?success=Logged out successfully");
    } catch (err) {
      console.error("Logout failed:", err);
      res.clearCookie("admintoken", { path: "/" });
      return res.redirect("/login?error=Logout failed");
    }
  }
  // Add these methods to your Admin class

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        req.flash("error", "Only admins can delete users");
        return res.redirect("/admin/dashboard");
      }

      // Prevent admin from deleting themselves
      if (id === req.user.userId) {
        req.flash("error", "Cannot delete your own account");
        return res.redirect("/admin/dashboard");
      }

      const userToDelete = await User.findById(id);
      if (!userToDelete) {
        req.flash("error", "User not found");
        return res.redirect("/admin/dashboard");
      }

      // Handle different user roles
      if (userToDelete.role === "technician") {
        // Delete from Technician collection first
        await Technician.findOneAndDelete({ userId: id });
      } else if (userToDelete.role === "manager") {
        // Delete from Manager collection first
        await Manager.findOneAndDelete({ userId: id });
      }

      // Now delete the user
      await User.findByIdAndDelete(id);

      console.log(`User ${id} deleted by admin`);
      req.flash("success", `${userToDelete.role} deleted successfully`);
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Delete user error:", error);
      req.flash("error", "Failed to delete user");
      return res.redirect("/admin/dashboard");
    }
  }

  async deleteTechnician(req, res) {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== "admin") {
        req.flash("error", "Only admins can delete technicians");
        return res.redirect("/admin/dashboard");
      }

      const technician = await Technician.findById(id);
      if (!technician) {
        req.flash("error", "Technician not found");
        return res.redirect("/admin/dashboard");
      }

      // Delete the technician record
      await Technician.findByIdAndDelete(id);

      // Also delete the user account
      await User.findByIdAndDelete(technician.userId);

      console.log(`Technician ${id} deleted by admin`);
      req.flash("success", "Technician deleted successfully");
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Delete technician error:", error);
      req.flash("error", "Failed to delete technician");
      return res.redirect("/admin/dashboard");
    }
  }

  async deleteManager(req, res) {
    try {
      const { id } = req.params;

      if (!req.user || req.user.role !== "admin") {
        req.flash("error", "Only admins can delete managers");
        return res.redirect("/admin/dashboard");
      }

      const manager = await Manager.findById(id);
      if (!manager) {
        req.flash("error", "Manager not found");
        return res.redirect("/admin/dashboard");
      }

      // Delete the manager record
      await Manager.findByIdAndDelete(id);

      // Also delete the user account
      await User.findByIdAndDelete(manager.userId);

      console.log(`Manager ${id} deleted by admin`);
      req.flash("success", "Manager deleted successfully");
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Delete manager error:", error);
      req.flash("error", "Failed to delete manager");
      return res.redirect("/admin/dashboard");
    }
  }
}

module.exports = new Admin();
