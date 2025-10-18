const jwt = require("jsonwebtoken");

// general auth check
const authChck = (req, res, next) => {
  try {
    const secret = process.env.JWT_SECRET || "jwt token";
    const { token } = req.cookies || {};

    req.user = null;
    req.isAuthenticated = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        req.isAuthenticated = true;
        console.log(`user authenticated:${decoded.role} - ${decoded.email}`);
      } catch (err) {
        console.log("token verification error", err.message);
        res.clearCookie("token", { Path: "/" });
      }
    }
    next();
  } catch (error) {
    console.log("Auth check middleware error", error);
    return next();
  }
};
module.exports = authChck;
