const Manager = require("../model/mangerSchema");
const jwt = require("jsonwebtoken");
const sendLoginCredentials = require("../helper/mailVerify");
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

      //   token verification
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
          },
        },
      ]);

      const manager = managerData[0];

      if (!manager || manager.length === 0) {
        return res.redirect("/login");
      }

      const user = manager.userDetails;

      const users = await User.find({ role: "user" })
        .select("-password")
        .limit(10)
        .sort({ createdAt: -1 });

      const technicians = await User.find({ role: "technician" })
        .select("-password")
        .limit(10)
        .sort({ createdAt: -1 });

      let technicianCount;
      if (req.user.role === "admin") {
        technicianCount = await User.countDocuments({ role: "technician" });
      } else {
        technicianCount = await User.countDocuments({
          role: "technician",
        });
      }

      const pendingBookings = await Booking.find({
        status: {
          $in: ["pending-manager-approval", "pending-manager-assignment"],
        },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      const pendingApprovalsCount = await Booking.countDocuments({
        status: "pending-manager-approval",
      });

      const pendingAssignmentsCount = await Booking.countDocuments({
        status: "pending-manager-assignment",
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
        },
        users: users,
        technicians: technicians,
        pendingBookings: pendingBookings,
        stats: {
          totalUsers: await User.countDocuments({ role: "user" }),
          totalTechnicians: technicianCount,
          pendingApprovals: pendingApprovalsCount,
          pendingAssignments: pendingAssignmentsCount,
          activeBookings: 12,
          completedToday: 5,
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
      res.render("manager/add-manager", {
        title: "Add New Manager",
        messages: req.flash(),
        temporaryPassword: temporaryPassword,
        // Add these default empty values for form fields
        name: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        department: "",
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

      if (!name || !email || !phone || !department || !address || !gender) {
        req.flash("error", "All fields are required");
        return res.redirect("/admin/add-manager");
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        req.flash("error", "User with this email already exists");
        return res.redirect("/admin/add-manager");
      }

      const temporaryPassword = generateRandomPassword();
      console.log("Temporary password:", temporaryPassword);

      const hashedPassword = await hashPassword(temporaryPassword);

      let createdById =
        req.user?.userId || (await User.findOne({ role: "admin" }))._id;
      let createdByRole = req.user?.role || "admin";
      console.log("Creator Role:", createdByRole);
      // image
      let imageUrl = "";
      if (req.file) {
        try {
          console.log("Uploading manager image to Cloudinary...");
          imageUrl = await uploadImageToCloudnary(req.file);
          console.log("Manager image uploaded:", imageUrl);
        } catch (uploadError) {
          console.error("Upload Error:", uploadError);
          return res
            .status(statuscode.BAD_REQUEST)
            .render("manager/add-manager", {
              title: "Add New Manager",
              error: "Failed to upload image",
              success: null,
              messages: req.flash(),
            });
        }
      }

      // CREATE IN USER COLLECTION
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        role: "manager",
        gender: gender,
        address: address.trim(), 
        userImage: imageUrl,
        isVerified: true,
      });

      await newUser.save();

      // CREATE IN MANAGER COLLECTION
      const newManager = new Manager({
        department: department,
        isActive: true,
        createdBy: createdById,
        createdByRole: createdByRole, 
        userId: newUser._id,
      });

      await newManager.save();

      console.log("Manager created in both collections:", newUser.email);

      await sendLoginCredentials(newUser, temporaryPassword);

      req.flash(
        "success",
        `Manager ${newUser.name} created. Credentials sent to email.`
      );
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Create manager error:", err);
      req.flash("error", "Error creating manager. Please try again.");
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
            "createdByDetails.name": 1,
            "createdByDetails.email": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      res.render("manager/managers-list", {
        title: "Managers List",
        managers: managers,
        messages: req.flash(),
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
        return res.redirect("/admin/managers-list");
      }

      const manager = await Manager.findById(managerId);

      if (!manager) {
        req.flash("error", "Manager not found");
        return res.redirect("/admin/managers-list");
      }

      await Manager.findByIdAndUpdate(managerId, { isActive: false });
      await User.findByIdAndUpdate(manager.userId, { isVerified: false });

      req.flash("success", "Manager deactivated successfully");
      res.redirect("/admin/managers-list");
    } catch (error) {
      console.error("Deactivate manager error:", error);
      req.flash("error", "Error deactivating manager");
      res.redirect("/admin/managers-list");
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
