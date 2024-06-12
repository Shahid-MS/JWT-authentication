const mongoose = require("mongoose");

// define the PasswordReset model schema
const PasswordResetSchema = new mongoose.Schema({
  user_id: {
    type: Object,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);
