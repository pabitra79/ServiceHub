const User = require("../model/userSchema");
const Technician = require("../model/technicianSchema");
const Booking = require("../model/bookingSchema");
const hashPassword = require("../helper/hassedpassword");
const { generateRandomPassword } = require("../helper/passwordHelper");
const { sendLoginCredentials } = require("../helper/mailVerify");
const uploadImageToCloudnary = require("../helper/cloudinary");
const statuscode = require("../helper/statusCode");
const mongoose = require("mongoose");

class technicianController {
  // Technician Dashboard
  async technicianDashboard(req, res) {
    try {
      console.log("===== TECHNICIAN DASHBOARD ACCESS ====");

      // Verify technician token and role
      const token = req.cookies.techniciantoken;
      if (!token) {
        return res.redirect("/login");
      }

      if (!req.user || req.user.role !== "technician") {
        console.log("Unauthorized technician access attempt");
        return res.redirect("/login");
      }

      const technicianId = req.user.userId;

      // Get technician data with user details
      const technicianData = await Technician.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(technicianId),
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
          $project: {
            _id: 1,
            specialization: 1,
            experience: 1,
            skills: 1,
            serviceAreas: 1,
            isActive: 1,
            currentWorkload: 1,
            maxWorkload: 1,
            availability: 1,
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

      if (!technicianData || technicianData.length === 0) {
        return res.redirect("/login");
      }

      const technician = technicianData[0];
      const user = technician.userDetails;

      // Get technician's assigned tasks statistics
      const assignedTasksCount = await Booking.countDocuments({
        technicianId: new mongoose.Types.ObjectId(technicianId),
        status: "assigned",
      });

      const inProgressTasksCount = await Booking.countDocuments({
        technicianId: new mongoose.Types.ObjectId(technicianId),
        status: "in-progress",
      });

      const completedTasksCount = await Booking.countDocuments({
        technicianId: new mongoose.Types.ObjectId(technicianId),
        status: "completed",
      });

      const completedTodayCount = await Booking.countDocuments({
        technicianId: new mongoose.Types.ObjectId(technicianId),
        status: "completed",
        workCompletedAt: {
          $gte: new Date().setHours(0, 0, 0, 0), // Today
        },
      });

      // Get recent assigned tasks
      const recentTasks = await Booking.aggregate([
        {
          $match: {
            technicianId: new mongoose.Types.ObjectId(technicianId),
            status: { $in: ["assigned", "in-progress"] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "customerId",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $unwind: {
            path: "$customerInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            serviceType: 1,
            problemDescription: 1,
            preferredDate: 1,
            preferredTime: 1,
            serviceAddress: 1,
            status: 1,
            urgency: 1,
            assignedDate: 1,
            workStartedAt: 1,
            customerName: 1,
            customerPhone: 1,
            customerEmail: 1,
            "customerInfo.userImage": 1,
          },
        },
        {
          $sort: {
            preferredDate: 1, // Show earliest first
            assignedDate: -1,
          },
        },
        {
          $limit: 5,
        },
      ]);

      console.log("Rendering technician dashboard for:", user.email);
      console.log("Assigned tasks:", assignedTasksCount);
      console.log("In progress tasks:", inProgressTasksCount);

      res.render("technician/dashboard", {
        title: "Technician Dashboard - ServiceHub",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userImage: user.userImage,
        },
        technician: {
          specialization: technician.specialization,
          experience: technician.experience,
          skills: technician.skills,
          serviceAreas: technician.serviceAreas,
          currentWorkload: technician.currentWorkload,
          maxWorkload: technician.maxWorkload,
          availability: technician.availability,
        },
        stats: {
          totalAssignedJobs:
            assignedTasksCount + inProgressTasksCount + completedTasksCount,
          pendingJobs: inProgressTasksCount,
          completedJobs: completedTasksCount,
          todayJobs: completedTodayCount,
          assignedTasks: assignedTasksCount,
          inProgressTasks: inProgressTasksCount,
        },
        recentTasks: recentTasks,
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Technician dashboard error:", error.message);
      req.flash("error", "Failed to load dashboard");
      res.redirect("/login");
    }
  }
  // Show add technician form
  async showAddTechnicianForm(req, res) {
    try {
      res.render("admin/add-technician", {
        title: "Add New Technician",
        messages: req.flash(),
        success: null,
        error: null,
      });
    } catch (error) {
      console.error("Show technician form error:", error);
      res.redirect("/admin/dashboard");
    }
  }

  // Create new technician
  async createTechnician(req, res) {
    try {
      const {
        name,
        email,
        phone,
        specialization,
        experience,
        skills,
        serviceAreas,
        gender,
        address,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !specialization ||
        !experience ||
        !gender ||
        !address
      ) {
        req.flash("error", "All fields are required");
        return res.redirect("/admin/add-technician");
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        req.flash("error", "User with this email already exists");
        return res.redirect("/admin/add-technician");
      }

      const temporaryPassword = generateRandomPassword();
      console.log("Temporary password:", temporaryPassword);

      const hashedPassword = await hashPassword(temporaryPassword);

      let createdById = req.user?.userId;
      let createdByRole = req.user?.role || "admin";

      console.log(
        "Creating technician - Creator ID:",
        createdById,
        "Role:",
        createdByRole
      );

      let imageUrl = "";
      if (req.file) {
        try {
          console.log("Uploading technician image to Cloudinary...");
          imageUrl = await uploadImageToCloudnary(req.file);
          console.log("Technician image uploaded:", imageUrl);
        } catch (uploadError) {
          console.error("Upload Error:", uploadError);
          return res
            .status(statuscode.BAD_REQUEST)
            .render("admin/add-technician", {
              title: "Add New Technician",
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
        role: "technician",
        gender: gender,
        address: address.trim(),
        userImage: imageUrl,
        isVerified: true,
      });

      await newUser.save();
      console.log(" Technician User saved:", newUser._id);

      // CREATE IN TECHNICIAN COLLECTION
      const newTechnician = new Technician({
        specialization: specialization,
        experience: parseInt(experience),
        skills: skills ? skills.split(",").map((skill) => skill.trim()) : [],
        serviceAreas: serviceAreas
          ? serviceAreas.split(",").map((area) => area.trim())
          : [],
        isActive: true,
        createdBy: createdById,
        createdByRole: createdByRole,
        userId: newUser._id,
      });

      await newTechnician.save();
      console.log(" Technician record saved:", newTechnician._id);

      console.log("Technician created in both collections:", newUser.email);

      // Send email credentials
      try {
        await sendLoginCredentials(newUser, temporaryPassword);
        console.log("Email sent successfully");
      } catch (emailError) {
        console.error(" Email sending failed:", emailError);
      }

      req.flash(
        "success",
        `Technician ${newUser.name} created successfully. Credentials sent to email.`
      );

      // Redirect based on who created
      if (createdByRole === "admin") {
        res.redirect("/admin/dashboard");
      } else {
        res.redirect("/manager/technicians-list");
      }
    } catch (err) {
      console.error("Create technician error:", err);

      if (err.name === "ValidationError") {
        console.log("Validation errors:", err.errors);
      }

      req.flash("error", "Error creating technician. Please try again.");
      res.redirect("/admin/dashboard");
    }
  }

  // Get all technicians
  async getAllTechnicians(req, res) {
    try {
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
          $addFields: {
            userData: {
              $cond: {
                if: { $gt: [{ $size: "$userData" }, 0] },
                then: { $arrayElemAt: ["$userData", 0] },
                else: {
                  name: "User Not Found",
                  email: "N/A",
                  phone: "N/A",
                  role: "technician",
                },
              },
            },
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

      res.render("admin/technicians-list", {
        title: "All Technicians",
        technicians: technicians,
        messages: req.flash(),
        success: null,
        error: null,
      });
    } catch (error) {
      console.error("Get technicians error:", error);
      req.flash("error", "Error fetching technicians");
      res.redirect("/admin/dashboard");
    }
  }
  async technicianLogout(req, res) {
    try {
      console.log("Technician logout requested by:", req.user?.email);
      res.clearCookie("techniciantoken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      req.flash("success", "Technician logged out successfully");
      res.redirect("/login");
    } catch (error) {
      console.error("Technician logout error:", error);
      res.redirect("/technician/dashboard");
    }
  }
}

module.exports = new technicianController();
