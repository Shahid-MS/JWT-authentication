const express = require("express");
const path = require("path");
const multer = require("multer");
const userController = require("../Controllers/userController");
const auth = require("../Middleware/auth");
const router = express();
router.use(express.json());

const {
  registerValidator,
  sendMailVerificationValidator,
  passwordResetValidator,
  loginValidator,
  updateProfileValidator,
} = require("../Helpers/validator");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, path.join(__dirname, "../public/images"));
    }
  },
  filename: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      const fileName = Date.now() + "_" + file.originalname;
      cb(null, fileName);
    }
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

router.post(
  "/register",
  upload.single("image"),
  registerValidator,
  userController.register
);

router.post(
  "/send-email-verification",
  sendMailVerificationValidator,
  userController.sendMailVerification
);

router.post(
  "/password-reset",
  passwordResetValidator,
  userController.passwordReset
);

router.post("/login", loginValidator, userController.login);

//Authenticated api

router.get("/user-profile", auth, userController.userProfile);

router.post(
  "/update-profile",
  auth,
  upload.single("image"),
  updateProfileValidator,
  userController.updateProfile
);

router.get("/refresh-token", auth, userController.refreshToken);

router.get("/logout", auth, userController.logout);

module.exports = router;
