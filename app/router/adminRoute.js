const express = require("express");
const router = express.Router();
const AdminController = require("../controller/adminController");
const { requireAdmin } = require("../middleware/roleMiddleware");

router.get("/admin/dashboard", requireAdmin, AdminController.adminDashboard);
router.get("/logout", AdminController.logout);

module.exports = router;
