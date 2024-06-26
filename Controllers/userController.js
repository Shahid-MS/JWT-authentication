const mongoose = require("mongoose");
const User = require("../Models/User");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const BlacklistToken = require("../Models/BlacklistToken.js");
const mailer = require("../Helpers/mailer");
const PasswordReset = require("../Models/PasswordReset");
const randomString = require("randomstring");
const ObjectId = mongoose.Types.ObjectId;
const path = require("path");
const { deleteFile } = require("../Helpers/deleteFiles.js");
const {
  generateAccesstoken,
  generateRefreshtoken,
} = require("../Helpers/token.js");
const {
  otpGenerator,
  oneMinOtpExpiry,
  threeMinOtpExpiry,
} = require("../Helpers/otpHelper");

const Otp = require("../Models/otp");
const { timeStamp } = require("console");

const register = async (req, res, file) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    const { name, email, mobile, password } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({
        success: false,
        msg: "User already exist with this email",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobile,
      password: hashPassword,
      image: "images/" + req.file.filename,
    });
    console.log(newUser.image);

    const userData = await newUser.save();
    const msg = `<p> Hii  ${name}. <a href = "http://localhost:8080/mail-verification/${userData._id}" >Verify </a> your account`;
    mailer.sendMail(email, "User Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Registered Successfully",
      user: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

//Mail Verification

const mailVerification = async (req, res) => {
  try {
    // console.log(req);
    const { id } = req.params;
    // console.log(id);
    const userData = await User.findById(id);

    if (!userData) {
      return res.render("mailVerification", { message: "User Not Found !!" });
    }
    if (userData.is_verified === 1) {
      return res.render("mailVerification", {
        message: "User already verified",
      });
    }

    await User.findByIdAndUpdate(id, {
      is_verified: 1,
    });

    return res.render("mailVerification", {
      message: "User verified successfully",
    });
  } catch (error) {
    console.log(error);
    return res.render("error.ejs");
  }
};

const sendMailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "User doesn't exist",
      });
    }

    if (userData.is_verified === 1) {
      return res.status(400).json({
        success: false,
        msg: "User already verified",
      });
    }

    const msg = `<p> Hii  ${userData.name}. <a href = "http://localhost:8080/mail-verification/${userData._id}" >Verify </a> your account`;
    mailer.sendMail(userData.email, "User Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Mail sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

//reset Password
const passwordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "User doesn't exist",
      });
    }

    const randomStr = randomString.generate();
    // console.log(randomStr);

    const msg = `<p> Hii  ${userData.name}. <a href = "http://localhost:8080/password-reset?token=${randomStr}" >Reset</a> your Password`;

    mailer.sendMail(userData.email, "Password Reset", msg);

    await PasswordReset.deleteMany({ user_id: userData._id });

    const passwordToken = PasswordReset({
      user_id: userData._id,
      token: randomStr,
    });

    passwordToken.save();

    return res.status(200).json({
      success: true,
      msg: "Mail sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const resetPasswordForm = async (req, res) => {
  try {
    // console.log(req.query);
    const { token } = req.query;
    if (typeof token === "undefined") {
      // console.log("wrong token")
      return res.render("error.ejs");
    }

    const resetData = await PasswordReset.findOne({ token });

    if (!resetData) {
      return res.render("error.ejs");
    }

    return res.render("resetPasswordForm.ejs", { resetData });
  } catch (error) {
    return res.render("error.ejs");
  }
};

const updatePassword = async (req, res) => {
  try {
    // console.log(req.body);
    const { user_id, password, c_password } = req.body;
    const resetData = await PasswordReset.findOne({
      user_id: new ObjectId(user_id),
    });

    // console.log(resetData);

    if (password != c_password) {
      return res.render("resetPasswordForm.ejs", {
        resetData,
        error: "Password and Confirm Password didn't match",
      });
    }

    const hashPassword = await bcrypt.hash(c_password, 10);

    await User.findByIdAndUpdate(user_id, {
      $set: {
        password: hashPassword,
      },
    });

    await PasswordReset.deleteMany({ user_id: new ObjectId(user_id) });

    return res.redirect("/reset-success");
  } catch (error) {
    console.log(error);
    return res.render("error.ejs");
  }
};

const resetSuccess = (req, res) => {
  try {
    return res.render("resetSuccess.ejs");
  } catch (error) {
    console.log(error);
    return res.render("error.ejs");
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }
    // console.log(req.body);
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is incorrect",
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    // console.log(passwordMatch);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is incorrect",
      });
    }

    if (userData.is_verified == 0) {
      return res.status(400).json({
        success: false,
        msg: "Please verify your account",
      });
    }

    const accessToken = await generateAccesstoken({ user: userData });
    const refreshToken = await generateRefreshtoken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Login successfully",
      user: userData,
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

const userProfile = async (req, res) => {
  try {
    const userData = req.user.user;
    return res.status(200).json({
      success: true,
      msg: "User successfully authenticated",
      user: userData,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const userData = req.user.user;
    const { name, mobile } = req.body;
    // console.log(req.body);

    const newData = {
      name,
      mobile,
    };

    if (req.file !== undefined) {
      // console.log(req.file.filename);
      newData.image = "images/" + req.file.filename;
      const oldUser = await User.findById(userData._id);
      const oldImagePath = path.join(__dirname, "../public/" + oldUser.image);

      deleteFile(oldImagePath);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      {
        $set: newData,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "User successfully updated",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    // console.log("Refresh token");
    const userId = req.user.user._id;
    const userData = await User.findById(userId);
    const accessToken = await generateAccesstoken({ user: userData });
    const refreshToken = await generateRefreshtoken({ user: userData });

    return res.status(200).json({
      success: true,
      msg: "Token Refreshed",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

const logout = async (req, res) => {
  try {
    const token =
      req.body.token || req.query.token || req.headers["authorization"];

    const bearer = token.split(" ");
    const bearerToken = bearer[1];

    const newBlacklistToken = new BlacklistToken({
      token: bearerToken,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    // console.log(newBlacklistToken);

    await newBlacklistToken.save();
    res.setHeader("Clear-Site-Data", "'cookies', 'storage'");
    return res.status(200).json({
      success: true,
      msg: "You are logged out successfully !!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { email } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "User doesn't exist",
      });
    }

    if (userData.is_verified === 1) {
      return res.status(400).json({
        success: false,
        msg: "User already verified",
      });
    }

    const oldOtpData = await Otp.findOne({
      user_id: userData._id,
    });
    if (oldOtpData) {
      const otpExpire = await oneMinOtpExpiry(oldOtpData.timeStamp);
      // console.log(oldOtpData);
      // console.log(oldOtpData.timeStamp);
      // console.log(otpExpire);

      if (!otpExpire) {
        return res.status(400).json({
          success: false,
          msg: "Please wait for sometime before resend otp",
        });
      }
    }

    const otp = otpGenerator();
    const currDate = new Date();
    await Otp.findOneAndUpdate(
      {
        user_id: userData._id,
      },
      {
        otp,
        timeStamp: new Date(currDate.getTime()),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // console.log(saveOtp);
    const msg = `<p> Hii  ${userData.name}. Your otp for verification is <b>${otp}</b></p>`;

    mailer.sendMail(userData.email, "Otp Verification", msg);

    return res.status(200).json({
      success: true,
      msg: "Mail sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Errors",
        errors: errors.array(),
      });
    }

    const { userId, otp } = req.body;

    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "User Id is not valid",
      });
    }
    if (userData.is_verified === 1) {
      return res.status(400).json({
        success: false,
        msg: "User is already verified",
      });
    }

    // console.log(req.body);
    const otpData = await Otp.findOne({
      user_id: userId,
      otp,
    });

    if (!otpData) {
      return res.status(400).json({
        success: false,
        msg: "You eneted wrong OTP",
      });
    }

    const isOtpExpired = await threeMinOtpExpiry(otpData.timeStamp);

    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        msg: "OTP has been expired",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        is_verified: 1,
      },
    });

    await Otp.findOneAndDelete({
      user_id: userId,
    });

    // console.log(updatedUser);

    return res.status(200).json({
      success: true,
      msg: "Your account has been verified successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
};

module.exports = {
  register,
  mailVerification,
  sendMailVerification,
  passwordReset,
  resetPasswordForm,
  updatePassword,
  resetSuccess,
  login,
  userProfile,
  updateProfile,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
};
