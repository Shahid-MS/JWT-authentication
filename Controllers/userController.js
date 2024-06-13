const mongoose = require("mongoose");
const User = require("../Models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const mailer = require("../Helpers/mailer");
const PasswordReset = require("../Models/PasswordReset");
const randomString = require("randomstring");
const ObjectId = mongoose.Types.ObjectId;

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

//Generating token
const generateAccesstoken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  return token;
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
    return res.status(200).json({
      success: true,
      msg: "Login successfully",
      user: userData,
      accessToken,
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
};
