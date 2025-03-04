const authService = require("../services/auth");

const authenticate = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = await authService.verifyToken(token.replace("Bearer ", ""));
    req.user = decoded; // Add user details to request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authenticate };
