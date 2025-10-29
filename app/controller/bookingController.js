const Booking = require("../model/bookingSchema");
const User = require("../model/userSchema");
const Technician = require("../model/technicianSchema");
const FeedbackController = require("./feedbackController");
const FeedbackService = require("../services/feedbackService");
const mongoose = require("mongoose");

class BookingController {
  async CreateBooking(req, res) {
    try {
      const {
        serviceType,
        problemDescription,
        preferredDate,
        preferredTime,
        serviceAddress,
        urgency,
      } = req.body;

      const customerId = req.user.userId;

      const customer = await User.findById(customerId);
      if (!customer) {
        req.flash("error", "Customer not found");
        res.redirect("/user/dashboard");
      }

      // create new booking WITHOUT technician details
      const newBooking = new Booking({
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerPhone: customer.phone,

        // NO technician details initially
        technicianId: null,
        technicianName: null,
        technicianSpecialization: null,

        serviceType,
        problemDescription,
        preferredDate,
        preferredTime: preferredTime || "10:00 AM",
        serviceAddress: serviceAddress || customer.address,
        urgency: urgency || "medium",

        // New status for manager assignment
        status: "pending-manager-assignment",
        // assignedBy: "manager", // Manager will assign
      });

      await newBooking.save();

      req.flash(
        "success",
        "Service request submitted successfully! Manager will assign a technician soon."
      );
      res.redirect("/user/dashboard");
    } catch (error) {
      console.error("Booking creation error:", error);
      req.flash("error", "Failed to create booking");
      res.redirect("/bookings/techniciansBook");
    }
  }
  async showBookingForm(req, res) {
    try {
      res.render("booking-form-new", {
        title: "Book Service",
        user: req.user,
        messages: {
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Show booking form error:", error);
      req.flash("error", "Something went wrong");
      res.redirect("/bookings/techniciansBook");
    }
  }

  // get all booking for login user (customer)
  async getuserBookings(req, res) {
    try {
      const customerId = req.user.userId;

      const bookings = await Booking.aggregate([
        {
          $match: {
            customerId: new mongoose.Types.ObjectId(customerId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "technicianId",
            foreignField: "_id",
            as: "technicianInfo",
          },
        },
        {
          $unwind: {
            path: "$technicianInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedBy",
            foreignField: "_id",
            as: "managerInfo",
          },
        },
        {
          $unwind: {
            path: "$managerInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            serviceType: 1,
            problemDescription: 1,
            preferredDate: 1,
            preferredTime: 1,
            serviceAddress: 1,
            status: 1,
            urgency: 1,
            createdAt: 1,
            technicianName: 1,
            technicianSpecialization: 1,
            assignedByName: 1,
            assignedDate: 1,
            workStartedAt: 1,
            workCompletedAt: 1,
            "technicianInfo.phone": 1,
            "managerInfo.name": 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      res.render("user/user-booking", {
        title: "My Bookings",
        bookings,
        user: req.user,
      });
    } catch (error) {
      console.error("Get user bookings error:", error);
      req.flash("error", "Failed to load bookings");
      res.redirect("/user/dashboard");
    }
  }

  // get all booking for manager
  async getAllBooking(req, res) {
    try {
      const { status } = req.query;
      let matchStage = {};

      if (status && status !== "all" && status !== "action-needed") {
        matchStage.status = status;
      } else if (!status || status === "action-needed") {
        // Show bookings that need manager action by default
        matchStage.status = "pending-manager-assignment";
      }

      console.log("Fetching bookings with filter:", matchStage);

      const bookings = await Booking.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "users",
            localField: "technicianId",
            foreignField: "_id",
            as: "technicianInfo",
          },
        },
        {
          $unwind: {
            path: "$technicianInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "technicians",
            localField: "technicianId",
            foreignField: "userId",
            as: "technicianDetails",
          },
        },
        {
          $unwind: {
            path: "$technicianDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            customerName: 1,
            customerEmail: 1,
            customerPhone: 1,
            customerAddress: 1,
            serviceType: 1,
            problemDescription: 1,
            preferredDate: 1,
            preferredTime: 1,
            serviceAddress: 1,
            status: 1,
            urgency: 1,
            createdAt: 1,
            technicianName: 1,
            technicianSpecialization: 1,
            assignedByName: 1,
            assignedDate: 1,
            assignedBy: 1,
            managerApprovedAt: 1,
            approvedBy: 1,
            "technicianInfo.phone": 1,
            "technicianInfo.email": 1,
            "technicianDetails.experience": 1,
            "technicianDetails.serviceAreas": 1,
            "technicianDetails.availability": 1,
            "technicianDetails.currentWorkload": 1,
            "technicianDetails.maxWorkload": 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      // Get all active technicians for assignment dropdown
      const technicians = await Technician.aggregate([
        {
          $match: { isActive: true },
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
          $unwind: "$userDetails",
        },
        {
          $project: {
            "userDetails._id": 1,
            "userDetails.name": 1,
            specialization: 1,
            experience: 1,
            availability: 1,
            currentWorkload: 1,
            maxWorkload: 1,
          },
        },
      ]);

      res.render("manager/manager-booking", {
        title: "Manage Bookings",
        bookings,
        technicians,
        user: req.user,
        selectedStatus: status || "action-needed",
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Get all bookings error:", error);
      req.flash("error", "Failed to load bookings");
      res.redirect("/manager/dashboard");
    }
  }
  async assignBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { technicianId } = req.body;
      const managerId = req.user.userId;

      console.log(
        `Assigning booking ${bookingId} to technician ${technicianId}`
      );

      // Find booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/manager/bookings");
      }

      // Check if booking needs assignment
      if (booking.status !== "pending-manager-assignment") {
        req.flash(
          "error",
          `Booking cannot be assigned. Current status: ${booking.status}`
        );
        return res.redirect("/bookings/manager/bookings");
      }

      // Get technician and manager details
      const [technicianData, managerData] = await Promise.all([
        Technician.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(technicianId),
              isActive: true,
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
            $unwind: "$userDetails",
          },
        ]),
        User.findById(managerId),
      ]);

      if (technicianData.length === 0) {
        req.flash("error", "Technician not found or inactive");
        return res.redirect("/bookings/manager/bookings");
      }

      const technician = technicianData[0];

      // Update booking with assignment - FIXED: Remove assignmentHistory
      booking.technicianId = technicianId;
      booking.technicianName = technician.userDetails.name;
      booking.technicianSpecialization = technician.specialization;
      booking.assignedBy = managerId;
      booking.assignedByName = managerData.name;
      booking.assignedDate = new Date();
      booking.status = "assigned"; // Change status to assigned
      booking.managerApprovedAt = new Date();
      booking.approvedBy = managerId;

      // REMOVED: assignmentHistory.push() since it's not in schema

      // Update technician workload
      await Technician.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(technicianId) },
        { $inc: { currentWorkload: 1 } }
      );

      await booking.save();

      console.log(
        `✅ Booking ${bookingId} assigned to ${technician.userDetails.name}`
      );

      req.flash(
        "success",
        `Booking assigned to ${technician.userDetails.name} successfully!`
      );
      res.redirect("/bookings/manager/bookings");
    } catch (error) {
      console.error("Assign booking error:", error);
      req.flash("error", "Failed to assign booking");
      res.redirect("/bookings/manager/bookings");
    }
  }

  // update booking status (technician only)
  // Technician updates booking status
  async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      const technicianId = req.user.userId;

      // Validate status
      const validStatuses = ["in-progress", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        req.flash("error", "Invalid status");
        return res.redirect("/bookings/technician/tasks");
      }

      // Find booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/technician/tasks");
      }

      // Check if technician is assigned to this booking
      if (booking.technicianId.toString() !== technicianId) {
        req.flash("error", "Not authorized to update this booking");
        return res.redirect("/bookings/technician/tasks");
      }

      // Update status and timestamps
      booking.status = status;

      if (status === "in-progress") {
        booking.workStartedAt = new Date();
      } else if (status === "completed") {
        booking.workCompletedAt = new Date();

        // Decrease technician workload
        await Technician.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(technicianId) },
          { $inc: { currentWorkload: -1 } }
        );

        try {
          await FeedbackController.requestFeedbackEmail(bookingId);
          console.log(` Feedback email triggered for booking ${bookingId}`);
        } catch (emailError) {
          console.error(" Failed to send feedback email:", emailError);
          // Don't fail the whole request if email fails
        }
      } else if (status === "completed") {
        booking.workCompletedAt = new Date();
        // Decrease technician workload when completed
        await Technician.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(technicianId) },
          { $inc: { currentWorkload: -1 } }
        );
      }

      await booking.save();

      req.flash("success", `Booking status updated to ${status}`);
      res.redirect("/bookings/technician/tasks");
    } catch (error) {
      console.error("Update booking status error:", error);
      req.flash("error", "Failed to update status");
      res.redirect("/bookings/technician/tasks");
    }
  }

  async getTechnicianTasks(req, res) {
    try {
      const technicianId = req.user.userId;

      const tasks = await Booking.aggregate([
        {
          $match: {
            technicianId: new mongoose.Types.ObjectId(technicianId),
            status: { $in: ["assigned", "in-progress", "completed"] },
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
            customerName: 1,
            customerEmail: 1,
            customerPhone: 1,
            customerAddress: 1,
            serviceType: 1,
            problemDescription: 1,
            preferredDate: 1,
            preferredTime: 1,
            serviceAddress: 1,
            status: 1,
            urgency: 1,
            createdAt: 1,
            assignedDate: 1,
            workStartedAt: 1,
            workCompletedAt: 1,
            assignedByName: 1,
            "customerInfo.userImage": 1,
          },
        },
        {
          $sort: {
            status: 1, // Show assigned first, then in-progress, then completed
            preferredDate: 1,
          },
        },
      ]);

      res.render("technician/technician-tasks", {
        title: "My Tasks",
        tasks,
        user: req.user,
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Get technician tasks error:", error);
      req.flash("error", "Failed to load tasks");
      res.redirect("/technician/dashboard");
    }
  }
  async bookingforTechnician(req, res) {
    try {
      const technicians = await Technician.aggregate([
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
          $unwind: "$userData",
        },
        {
          $project: {
            userId: "$userData._id",
            name: "$userData.name",
            email: "$userData.email",
            phone: "$userData.phone",
            userImage: "$userData.userImage", // Make sure this is included
            specialization: 1,
            experience: 1,
            serviceAreas: 1,
            skills: 1,
            availability: 1,
            currentWorkload: { $ifNull: ["$currentWorkload", 0] }, // Default to 0 if null
            maxWorkload: { $ifNull: ["$maxWorkload", 5] }, // Default to 5 if null
            rating: 1,
            hourlyRate: 1,
          },
        },
        {
          $sort: {
            currentWorkload: 1, // Show less busy technicians first
            availability: 1,
          },
        },
      ]);

      console.log(`Found ${technicians.length} active technicians`);

      // Debug: Log technician data
      technicians.forEach((tech, index) => {
        console.log(`Tech ${index + 1}:`, {
          name: tech.name,
          availability: tech.availability,
          workload: `${tech.currentWorkload}/${tech.maxWorkload}`,
          userImage: tech.userImage,
        });
      });

      return res.render("technicians-public", {
        title: "Our Technicians",
        technicians,
        user: req.user,
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
        },
      });
    } catch (error) {
      console.error("Technicians list error:", error);
      req.flash("error", "Failed to load technicians");
      return res.redirect("/user/dashboard");
    }
  }

  // Manager approves booking (if you still need this for other flows)
  async approveBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { action } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/manager/bookings");
      }

      // This method might not be needed in new flow, but keeping for compatibility
      if (action === "approve") {
        booking.status = "assigned";
        booking.managerApprovedAt = new Date();
        booking.approvedBy = req.user.userId;
        booking.assignedByName = req.user.name;
        booking.assignedDate = new Date();

        req.flash("success", "Booking approved!");
      }

      await booking.save();
      res.redirect("/bookings/manager/bookings");
    } catch (error) {
      console.error("Approval error:", error);
      req.flash("error", "Failed to process approval");
      res.redirect("/bookings/manager/bookings");
    }
  }
  //
  async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      const technicianId = req.user.userId;

      // Validate status
      const validStatuses = ["in-progress", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        req.flash("error", "Invalid status");
        return res.redirect("/bookings/technician/tasks");
      }

      // Find booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/technician/tasks");
      }

      // Check if technician is assigned to this booking
      if (booking.technicianId.toString() !== technicianId) {
        req.flash("error", "Not authorized to update this booking");
        return res.redirect("/bookings/technician/tasks");
      }

      // Update status and timestamps
      booking.status = status;

      if (status === "in-progress") {
        booking.workStartedAt = new Date();
      } else if (status === "completed") {
        booking.workCompletedAt = new Date();

        // Decrease technician workload when completed
        await Technician.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(technicianId) },
          { $inc: { currentWorkload: -1 } }
        );

        // ✅ NEW: Send feedback request email to customer
        try {
          await FeedbackService.requestFeedback(bookingId, technicianId);
          console.log(`Feedback request sent for booking ${bookingId}`);
        } catch (emailError) {
          console.error("Failed to send feedback email:", emailError);
          // Don't fail the whole request if email fails
        }
      }

      await booking.save();

      req.flash("success", `Booking status updated to ${status}`);
      res.redirect("/bookings/technician/tasks");
    } catch (error) {
      console.error("Update booking status error:", error);
      req.flash("error", "Failed to update status");
      res.redirect("/bookings/technician/tasks");
    }
  }
}

module.exports = new BookingController();
