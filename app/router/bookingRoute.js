const express = require("express");
const router = express.Router();
const bookingController = require("../controller/bookingController");
const {
  requireUser,
  requireManager,
  requireTechnician,
  requireRoles,
} = require("../middleware/roleMiddleware");

// Customer routes
router.get(
  "/techniciansBook",
  requireUser,
  bookingController.bookingforTechnician
);

router.get(
  "/book/:technicianId",
  requireUser,
  bookingController.showBookingForm
);
router.post("/book", requireUser, bookingController.CreateBooking);
router.get("/my-bookings", requireUser, bookingController.getuserBookings);

// Manager routes(both can access)
router.get(
  "/manager/bookings",
  requireRoles("manager", "admin"),
  bookingController.getAllBooking
);

// Manager approval routes - ADD THESE NEW ROUTES
router.post(
  "/manager/bookings/approve/:bookingId",
  requireRoles("manager", "admin"),
  bookingController.approveBooking
);

router.post(
  "/manager/bookings/assign/:bookingId",
  requireRoles("manager", "admin"),
  bookingController.assignBooking // This uses the updated assignBooking method
);

// Technician routes
router.get(
  "/technician/tasks",
  requireTechnician,
  bookingController.getTechnicianTasks
);
router.post(
  "/technician/tasks/update-status/:bookingId",
  requireTechnician,
  bookingController.updateBookingStatus
);
//its forx technician form

module.exports = router;
