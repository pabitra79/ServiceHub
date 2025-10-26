const Booking = require("../model/bookingSchema");
const User = require("../model/userSchema");
const Technician = require("../model/technicianSchema");
const mongoose = require("mongoose");

class BookingController {
  async CreateBooking(req, res) {
    try {
      const {
        technicianId,
        serviceType,
        problemDescription,
        preferredDate,
        preferredTime,
        serviceAddress,
        urgency,
      } = req.body;

      const customerId = req.user.userId;

      // get customer details
      const customer = await User.findById(customerId);
      if (!customer) {
        req.flash("error", "Customer not found");
        return res.redirect("/technicians");
      }

      // get technician data using aggregate
      const technicianData = await Technician.aggregate([
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
      ]);

      if (technicianData.length === 0) {
        req.flash("error", "Technician not found or not active");
        return res.redirect("/technicians");
      }

      const technician = technicianData[0];
      // Check technician availability
      let flashMessage = "success";
      let message =
        "Booking submitted successfully! Manager will review and confirm the assignment.";

      if (
        technician.availability !== "available" ||
        technician.currentWorkload >= technician.maxWorkload
      ) {
        flashMessage = "warning";
        message = `${technician.userDetails.name} is currently busy. Manager will review and assign the best available technician.`;
      }

      // create new booking with all details
      const newBooking = new Booking({
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerPhone: customer.phone,

        technicianId,
        technicianName: technician.userDetails.name,
        technicianSpecialization: technician.specialization,

        serviceType,
        problemDescription,
        preferredDate,
        preferredTime: preferredTime || "10:00 AM",
        serviceAddress: serviceAddress || customer.address,
        urgency: urgency || "medium",
        status: "pending-manager-approval",
        assignedBy: "customer",
      });

      await newBooking.save();

      // Update technician workload only if available
      if (
        technician.availability === "available" &&
        technician.currentWorkload < technician.maxWorkload
      ) {
        await Technician.updateOne(
          { userId: new mongoose.Types.ObjectId(technicianId) },
          { $inc: { currentWorkload: 1 } }
        );
      }
      req.flash(
        "success",
        "Booking created successfully! Manager will assign it soon."
      );
      res.redirect("/user/dashboard");
    } catch (error) {
      console.error("Booking creation error:", error);
      req.flash("error", "Failed to create booking");
      res.redirect("/bookings/techniciansBook");
    }
  }

  // showing booking form
  async showBookingForm(req, res) {
    try {
      const { technicianId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        req.flash("error", "Invalid technician ID");
        return res.redirect("/technicians");
      }

      const technicianData = await Technician.aggregate([
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
        { $unwind: "$userDetails" },
      ]);

      if (technicianData.length === 0) {
        req.flash("error", "Technician not found");
        return res.redirect("/technicians");
      }

      const technician = technicianData[0];
      res.render("booking-form", {
        title: "Book Service",
        technician,
        user: req.user,
      });
    } catch (error) {
      console.error("Show booking form error:", error);
      req.flash("error", "Something went wrong");
      res.redirect("/technicians");
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
        matchStage.status = {
          $in: ["pending-manager-approval", "pending-manager-assignment"],
        };
      }
      // If status is 'all', no status filter

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

      console.log(
        `Found ${bookings.length} bookings and ${technicians.length} technicians`
      ); // DEBUG

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
  // manager assign task to technician (manager only) - UPDATE THIS METHOD
  async assignBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { technicianId } = req.body;
      const managerId = req.user.userId;

      // Find booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/manager/bookings");
      }

      // Check if booking needs manager assignment
      if (
        !["pending-manager-approval", "pending-manager-assignment"].includes(
          booking.status
        )
      ) {
        req.flash(
          "error",
          `Booking cannot be assigned. Current status: ${booking.status}`
        );
        return res.redirect("/bookings/manager/bookings");
      }

      // Get technician and manager details using aggregate
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
        req.flash("error", "Technician not found");
        return res.redirect("/bookings/manager/bookings");
      }

      const technician = technicianData[0];

      // Update booking
      booking.technicianId = technicianId;
      booking.technicianName = technician.userDetails.name;
      booking.technicianSpecialization = technician.specialization;
      booking.assignedBy = managerId;
      booking.assignedByName = managerData.name;
      booking.assignedDate = new Date();
      booking.status = "assigned";
      booking.approvedBy = managerId;
      booking.managerApprovedAt = new Date();

      // Update technician workload
      await Technician.updateOne(
        { userId: new mongoose.Types.ObjectId(technicianId) },
        { $inc: { currentWorkload: 1 } }
      );

      await booking.save();

      req.flash("success", "Booking assigned successfully!");
      res.redirect("/bookings/manager/bookings");
    } catch (error) {
      console.error("Assign booking error:", error);
      req.flash("error", "Failed to assign booking");
      res.redirect("/bookings/manager/bookings");
    }
  }

  // update booking status (technician only)
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
          $match: { technicianId: new mongoose.Types.ObjectId(technicianId) },
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
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      res.render("technician/technician-tasks", {
        title: "My Tasks",
        tasks,
        user: req.user,
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
            specialization: 1,
            experience: 1,
            serviceAreas: 1,
            rating: 1,
            hourlyRate: 1,
            userImage: "$userData.userImage",
            skills: 1,
            // ADD THESE NEW FIELDS:
            availability: 1,
            currentWorkload: 1,
            maxWorkload: 1,
          },
        },
      ]);
      console.log("Technicians data:", technicians.length);
      res.render("technicians-public", {
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
      res.redirect("/user/dashboard");
    }
  }
  // Manager approves or reassigns booking - ADD THIS METHOD
  async approveBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { action } = req.body; // 'approve' or 'reassign'

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/bookings/manager/bookings");
      }

      if (action === "approve") {
        // Approve the customer's chosen technician
        booking.status = "assigned";
        booking.managerApprovedAt = new Date();
        booking.approvedBy = req.user.userId;
        booking.assignedByName = req.user.name;
        booking.assignedDate = new Date();

        req.flash("success", "Booking approved and assigned to technician!");
      } else {
        // Manager wants to reassign
        booking.status = "pending-manager-assignment";

        // Decrement workload from original technician
        await Technician.updateOne(
          { userId: booking.technicianId },
          { $inc: { currentWorkload: -1 } }
        );

        req.flash(
          "info",
          "Booking queued for reassignment to different technician"
        );
      }

      await booking.save();
      res.redirect("/bookings/manager/bookings");
    } catch (error) {
      console.error("Approval error:", error);
      req.flash("error", "Failed to process approval");
      res.redirect("/bookings/manager/bookings");
    }
  }

  // Manager assigns technician to pending assignments - ADD THIS METHOD
  async assignTechnician(req, res) {
    try {
      const { bookingId } = req.params;
      const { technicianId } = req.body;
      const managerId = req.user.userId;

      const [booking, manager, technicianData] = await Promise.all([
        Booking.findById(bookingId),
        User.findById(managerId),
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
          { $unwind: "$userDetails" },
        ]),
      ]);

      if (!booking || !manager || technicianData.length === 0) {
        req.flash("error", "Booking, manager, or technician not found");
        return res.redirect("/bookings/manager/bookings");
      }

      const technician = technicianData[0];

      // If booking had a previous technician, decrement their workload
      if (booking.technicianId && booking.status === "assigned") {
        await Technician.updateOne(
          { userId: booking.technicianId },
          { $inc: { currentWorkload: -1 } }
        );
      }

      // Update booking with new technician
      booking.technicianId = technicianId;
      booking.technicianName = technician.userDetails.name;
      booking.technicianSpecialization = technician.specialization;
      booking.status = "assigned";
      booking.assignedBy = managerId;
      booking.assignedByName = manager.name;
      booking.assignedDate = new Date();
      booking.approvedBy = managerId;
      booking.managerApprovedAt = new Date();

      // Update new technician's workload
      await Technician.updateOne(
        { userId: new mongoose.Types.ObjectId(technicianId) },
        { $inc: { currentWorkload: 1 } }
      );

      await booking.save();
      req.flash("success", "Technician assigned successfully!");
      res.redirect("/bookings/manager/bookings");
    } catch (error) {
      console.error("Assignment error:", error);
      req.flash("error", "Failed to assign technician");
      res.redirect("/bookings/manager/bookings");
    }
  }
}

module.exports = new BookingController();
