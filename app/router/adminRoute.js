const express = require("express");
const router = express.Router();
const AdminController = require("../controller/adminController");
const { requireAdmin } = require("../middleware/roleMiddleware");

router.get("/admin/dashboard", requireAdmin, AdminController.adminDashboard);
router.get("/logout", AdminController.logout);
// DELETE ROUTES - Add these
router.post("/admin/user/:id/delete", requireAdmin, AdminController.deleteUser);
router.post(
  "/admin/technician/:id/delete",
  requireAdmin,
  AdminController.deleteTechnician
);
router.post(
  "/admin/manager/:id/delete",
  requireAdmin,
  AdminController.deleteManager
);

module.exports = router;
