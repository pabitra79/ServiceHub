require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const flash = require("connect-flash");
const cookieparser = require("cookie-parser");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(flash());
app.use(cookieparser());

app.use((req, res, next) => {
  res.locals.messages = {
    error: req.flash("error"),
    success: req.flash("success"),
  };
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

app.use("/uploads", express.static(uploadsDir));

// router and db////////////////
const DbConnnection = require("./app/config/dbConnection");
DbConnnection();
// routes of all //////////////////////////////////////////////
// Route for About page
app.get("/about", (req, res) => {
  res.render("layouts/about", { title: "About Us" });
});
app.get("/home", (req, res) => {
  res.render("layouts/home", { title: "Home" });
});
app.get("/services", (req, res) => {
  res.render("layouts/services", { title: "Home" });
});
const HomeRoute = require("./app/router/homeRoute");
app.use("/", HomeRoute);
const UserRouter = require("./app/router/userRouter");
app.use(UserRouter);
const TechnicianRouter = require("./app/router/technicianRoute");
app.use(TechnicianRouter);
const AdminRouter = require("./app/router/adminRoute");
app.use("/", AdminRouter);
const AdmiMangerRouter = require("./app/router/managerRoute");
app.use(AdmiMangerRouter);
const ManagerRouter = require("./app/router/managerRoute");
app.use(ManagerRouter);
const bookingRoutes = require("./app/router/bookingRoute");
app.use("/bookings", bookingRoutes);
// port/////////////////
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
