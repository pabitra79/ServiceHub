const express = require("express");
const router = express.Router();
const technicianController = require("../controller/technicianController");
const {
  requireTechnician,
  requireAdmin,
} = require("../middleware/roleMiddleware");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// technician routes
router.get(
  "/technician/dashboard",
  requireTechnician,
  technicianController.technicianDashboard
);
// Admin technician management routes
router.get(
  "/admin/add-technician",
  requireAdmin,
  technicianController.showAddTechnicianForm
);
router.post(
  "/admin/create-technician",
  requireAdmin,
  upload.single("userImage"),
  technicianController.createTechnician
);
router.get(
  "/admin/technicians-list",
  requireAdmin,
  technicianController.getAllTechnicians
);
router.get(
  "/technician/logout",
  requireTechnician,
  technicianController.technicianLogout
);
module.exports = router;
