const express = require("express");
const router = express.Router();
const managerController = require("../controller/managerController");
const {
  requireAdmin,
  requireManager,
} = require("../middleware/roleMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Show add manager form
router.get(
  "/admin/add-manager",
  requireAdmin,
  managerController.showAddManagerForm
);

// Create new manager
router.post(
  "/admin/create-manager",
  requireAdmin,
  upload.single("userImage"),
  managerController.createManager
);

// Get all managers list
router.get(
  "/admin/managers-list",
  requireAdmin,
  managerController.getAllManagers
);

// Deactivate manager
router.post(
  "/admin/managers/:managerId/deactivate",
  requireAdmin,
  managerController.deactivateManager
);

// Delete manager
router.post(
  "/admin/managers/:managerId/delete",
  requireAdmin,
  managerController.deleteManager
);
router.get(
  "/manager/dashboard",
  requireManager,
  managerController.managerDashboard
);
// Get manager details
router.get(
  "/manager/managers/:managerId/details",
  requireManager,
  managerController.getManagerDetails
);
router.get("/manager/logout", requireManager, managerController.managerLogout);

module.exports = router;
