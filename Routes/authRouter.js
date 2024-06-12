const express = require("express");
const path = require("path");
const userController = require("../Controllers/userController");
const bodyParser = require("body-parser");

const router = express();
router.use(express.json());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/mail-verification/:id", userController.mailVerification);

router.get("/password-reset", userController.resetPasswordForm);

router.post("/password-reset", userController.updatePassword);

router.get("/reset-success", userController.resetSuccess);

module.exports = router;
