// router/publicRoute.js
const express = require("express");
const router = express.Router();
const homeController = require("../controller/homeController");

// Public routes (no authentication required)
router.get("/", homeController.getHomePage);
router.get("/technicians", homeController.getAllTechniciansPublic);


module.exports = router;
