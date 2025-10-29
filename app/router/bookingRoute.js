const express = require("express");
const router = express.Router();
const bookingController = require("../controller/bookingController");
const feedbackController = require("../controller/feedbackController"); //  THIS
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

router.post(
  "/manager/bookings/approve/:bookingId",
  requireRoles("manager", "admin"),
  bookingController.approveBooking
);

router.post(
  "/manager/bookings/assign/:bookingId",
  requireRoles("manager", "admin"),
  bookingController.assignBooking
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
router.get("/book/new", requireUser, bookingController.showBookingForm);
// new add
router.get("/feedback/:bookingId", feedbackController.showEmailFeedbackForm);
router.post("/feedback/:bookingId", feedbackController.submitEmailFeedback);
module.exports = router;
