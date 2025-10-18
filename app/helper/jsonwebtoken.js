const jwt = require("jsonwebtoken");

function generationToken(user) {
  console.log("Generating token with user data:", {
    userId: user.userId || user._id,
    email: user.email,
    role: user.role,
  });

  return jwt.sign(
    {
      userId: user.userId || user._id, // Ensure userId is included
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
module.exports = generationToken;
