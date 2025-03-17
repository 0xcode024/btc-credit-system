//api routes to create, get, update, delete user info ...

const express = require("express");
const userController = require("../controllers/user");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/", userController.createUser);
router.get("/", authenticate, userController.getUsers);
router.get("/info", authenticate, userController.getUserInfo);
router.get("/info/:address", userController.getUserByPaymentAddress);
router.get("/:id", authenticate, userController.getUserById);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
