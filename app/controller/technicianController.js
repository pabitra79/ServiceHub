const User = require("../model/userSchema");
const Technician = require("../model/technicianSchema");
const hashPassword = require("../helper/hassedpassword");
const { generateRandomPassword } = require("../helper/passwordHelper");
const sendLoginCredentials = require("../helper/mailVerify");
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

      // Get technician data with user details
      const technicianData = await Technician.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.userId),
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

      console.log("Rendering technician dashboard for:", user.email);

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
        },
        stats: {
          totalAssignedJobs: 0,
          completedJobs: 0,
          pendingJobs: 0,
          earnings: 0,
        },
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Technician dashboard error:", error.message);
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
