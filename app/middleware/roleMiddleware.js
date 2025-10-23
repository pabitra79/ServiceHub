const jwt = require("jsonwebtoken");
const statuscode = require("../helper/statusCode");

const requireAdmin = (req, res, next) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
  const { admintoken } = req.cookies || {};

  if (!admintoken) {
    console.log("No token found, redirecting to login");
    return res.redirect("/login");
  }

  jwt.verify(admintoken, secret, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err.message);
      res.clearCookie("admintoken", { path: "/" });
      return res.redirect("/login");
    }

    if (decoded.role !== "admin") {
      console.log("Access denied: Not an admin");
      return res.status(statuscode.UNAUTHORIZED).render("error", {
        message: "Admin access only",
      });
    }

    // console.log("Admin authenticated:", decoded.email);
    req.user = decoded;
    next();
  });
};

const requireManager = (req, res, next) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
  const { managertoken } = req.cookies || {};

  if (!managertoken) {
    console.log("No token found, redirecting to login");
    return res.redirect("/login");
  }

  jwt.verify(managertoken, secret, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err.message);
      res.clearCookie("managertoken", { path: "/" });
      return res.redirect("/login");
    }

    if (decoded.role !== "manager") {
      console.log("Access denied: Not a manager");
      return res.status(403).render("error", {
        message: "Manager access only",
      });
    }

    console.log("Manager authenticated:", decoded.email);
    req.user = decoded;
    next();
  });
};
// Only Technician can access
const requireTechnician = (req, res, next) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
  const { techniciantoken } = req.cookies || {};

  if (!techniciantoken) {
    console.log("No token found, redirecting to login");
    return res.redirect("/login");
  }

  jwt.verify(techniciantoken, secret, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err.message);
      res.clearCookie("techniciantoken", { path: "/" });
      return res.redirect("/login");
    }

    if (decoded.role !== "technician") {
      console.log("Access denied: Not a technician");
      return res.status(403).render("error", {
        message: "Technician access only",
      });
    }

    console.log("Technician authenticated:", decoded.email);
    req.user = decoded;
    next();
  });
};
// Only User/Customer can access
const requireUser = (req, res, next) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
  const { usertoken } = req.cookies || {};

  if (!usertoken) {
    console.log("No token found, redirecting to login");
    return res.redirect("/login");
  }

  jwt.verify(usertoken, secret, (err, decoded) => {
    if (err) {
      console.log("Token verification error:", err.message);
      res.clearCookie("usertoken", { path: "/" });
      return res.redirect("/login");
    }

    if (decoded.role !== "user") {
      console.log("Access denied: Not a user");
      return res.status(403).render("error", {
        message: "User access only",
      });
    }

    console.log("User authenticated:", decoded.email);
    req.user = decoded;
    // its for booking user
    const token = req.cookies.usertoken;

    if (!token) {
      console.log("No usertoken found - redirecting to login");
      return res.redirect("/login");
    }

    const decoded1 = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded1;
    next();
  });
};

// Multiple roles allowed (flexible)
// Multiple roles allowed (flexible)
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";

    // Check ALL possible token cookies based on allowed roles
    let token = null;
    let tokenType = null;

    // Try to find token based on allowed roles
    if (allowedRoles.includes("manager") && req.cookies.managertoken) {
      token = req.cookies.managertoken;
      tokenType = "manager";
    } else if (allowedRoles.includes("admin") && req.cookies.admintoken) {
      token = req.cookies.admintoken;
      tokenType = "admin";
    } else if (
      allowedRoles.includes("technician") &&
      req.cookies.techniciantoken
    ) {
      token = req.cookies.techniciantoken;
      tokenType = "technician";
    } else if (allowedRoles.includes("user") && req.cookies.usertoken) {
      token = req.cookies.usertoken;
      tokenType = "user";
    }

    if (!token) {
      console.log("No token found, redirecting to login");
      return res.redirect("/login");
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.log("Token verification error:", err.message);
        // Clear the specific token that failed
        if (tokenType) {
          res.clearCookie(`${tokenType}token`, { path: "/" });
        }
        return res.redirect("/login");
      }

      if (!allowedRoles.includes(decoded.role)) {
        console.log(`Access denied: Role ${decoded.role} not allowed`);
        return res.status(403).render("error", {
          message: `Access requires one of: ${allowedRoles.join(", ")}`,
        });
      }

      console.log(`${decoded.role} authenticated:`, decoded.email);
      req.user = decoded;
      next();
    });
  };
};
module.exports = {
  requireAdmin,
  requireManager,
  requireTechnician,
  requireRoles,
  requireUser,
};
