const Technician = require("../model/technicianSchema");
const User = require("../model/userSchema");

class HomeController {
  async getHomePage(req, res) {
    try {
      // Get 3 featured technicians for homepage preview
      const featuredTechnicians = await Technician.aggregate([
        {
          $match: { isActive: true },
        },
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
                else: null,
              },
            },
          },
        },
        {
          $match: {
            userData: { $ne: null },
          },
        },
        {
          $project: {
            _id: 1,
            specialization: 1,
            experience: 1,
            skills: 1,
            serviceAreas: 1,
            "userData.name": 1,
            "userData.userImage": 1,
            "userData.phone": 1,
            "userData.email": 1,
          },
        },
        { $limit: 6 },
        { $sort: { experience: -1 } },
      ]);

      res.render("home", {
        title: "ServiceHub - Professional Appliance Repair",
        featuredTechnicians: featuredTechnicians,
        user: req.user || null, // ADD THIS LINE - pass user to template
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Home page error:", error);
      res.render("home", {
        title: "ServiceHub - Professional Appliance Repair",
        featuredTechnicians: [],
        user: req.user || null, // ADD THIS LINE
        messages: req.flash(),
      });
    }
  }

  async getAllTechniciansPublic(req, res) {
    try {
      const technicians = await Technician.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
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
                else: null,
              },
            },
          },
        },
        {
          $match: {
            userData: { $ne: null },
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
            "userData.userImage": 1,
            "userData.gender": 1,
            "userData.address": 1,
          },
        },
        { $sort: { experience: -1 } },
      ]);

      res.render("technicians-public", {
        title: "Our Expert Technicians - ServiceHub",
        technicians: technicians,
        user: req.user || null, // ADD THIS LINE
        messages: req.flash(),
      });
    } catch (error) {
      console.error("Get public technicians error:", error);
      res.render("technicians-public", {
        title: "Our Expert Technicians - ServiceHub",
        technicians: [],
        user: req.user || null, // ADD THIS LINE
        messages: { error: "Error loading technicians" },
      });
    }
  }
}

module.exports = new HomeController();
