const UserService = require("../services/user");

const { verifyMessage } = require("../utils/VerifyMessage");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const { paymentAddress, paymentPubkey, message, signature, userInfo } =
      req.body;
    console.log(paymentAddress, message, signature, userInfo);
    const result = await verifyMessage(paymentPubkey, message, signature);
    if (!result) throw new Error("Invalid Signature");

    let user = await UserService.findUser({ paymentAddress });
    console.log("User=>", user);
    if (!user) {
      // throw new Error("User not found");
      user = await UserService.createUser(userInfo);
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        id: user._id,
        paymentAddress: user.paymentAddress,
      },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = { login };
