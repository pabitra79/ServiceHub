const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController");
const multer = require("multer"); // Add this line
const { requireUser } = require("../middleware/roleMiddleware");

// Add multer configuration
const upload = multer({
  dest: "uploads/", // This will create an 'uploads' folder automatically
});

// Change ONLY the register route - add upload.single()
router.get("/register", UserController.RegisterView);
router.post("/register", upload.single("userImage"), UserController.register); // ADD THIS
router.get("/login", UserController.loginView);
router.post("/login", UserController.login);
router.get("/logout", UserController.logout);

router.get("/user/dashboard", requireUser, UserController.userDashboard);
router.get("/profile", requireUser, (req, res) => {
  res.render("user/profile", {
    title: "My Profile",
    user: req.user,
  });
});

router.get("/settings", requireUser, (req, res) => {
  res.render("user/settings", {
    title: "Settings",
    user: req.user,
  });
});

router.get("/support", requireUser, (req, res) => {
  res.render("user/support", {
    title: "Contact Support",
    user: req.user,
  });
});

module.exports = router;
