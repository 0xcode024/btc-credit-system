//api routes to create, get, update, delete user info ...

const express = require("express");
const userController = require("../controllers/user");
const { authenticate } = require("../middlewares/auth");
const { validateUserInput } = require("../middlewares/validateUser");

const router = express.Router();

router.post("/", userController.createUser);
router.get("/all", authenticate, userController.getUsers);
router.get("/info", authenticate, userController.getUserInfo);
router.get("/info/:address", userController.getUserByAddress);
router.put("/info", authenticate, validateUserInput, userController.updateUser);
router.delete("/info", authenticate, userController.deleteUser);

router.get("/:id", authenticate, userController.getUserById);

module.exports = router;
