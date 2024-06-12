const { check } = require("express-validator");

exports.registerValidator = [
  check("name", "Name is Required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),

  check("mobile", "Mobile number should contains 10 digits").isLength({
    // min: 10,
    max: 10,
  }),

  check(
    "password",
    "Password must be greater than 6 letter and contain one uppercase and lowercase, number and special characters"
  ).isStrongPassword({
    minLength: 6,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
  }),

  check("image")
    .custom((value, { req }) => {
      if (
        req.file.mimetype === "image/jpeg" ||
        req.file.mimetype === "image/png"
      ) {
        return true;
      } else {
        return false;
      }
    })
    .withMessage("Please upload a image of jpeg or png"),
];

exports.sendMailVerificationValidator = [
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
];

exports.passwordResetValidator = [
  check("email", "Please include a valid email").isEmail().normalizeEmail({
    gmail_remove_dots: true,
  }),
];
