const mongoose = require("mongoose");

// define the User model schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_verified: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
