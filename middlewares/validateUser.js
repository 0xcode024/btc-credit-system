const validator = require("validator");
const libphonenumber = require("libphonenumber-js");
const moment = require("moment");

const validateUserInput = (req, res, next) => {
  const { username, phoneNumber, email, dateOfBirth } = req.body;
  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (phoneNumber) {
    try {
      const validPhone = libphonenumber.parsePhoneNumberFromString(phoneNumber);
      if (!validPhone || !validPhone.isValid()) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
  }
  if (dateOfBirth) {
    if (!moment(dateOfBirth, "YYYY-MM-DD", true).isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
  }
  next();
};

module.exports = { validateUserInput };
