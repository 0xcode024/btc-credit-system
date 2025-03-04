// service for auth
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET; // Replace with a strong secret key

const verifyToken = async (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    throw new Error("Invalid token");
  }
};

module.exports = { verifyToken };
