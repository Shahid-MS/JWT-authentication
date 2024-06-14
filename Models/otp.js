const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  timeStamp: {
    type: Date,
    default: Date.now,

    get: function (timeStamp) {
      return timeStamp.getTime();
    },
    set: function (timeStamp) {
      return new Date(timeStamp);
    },
  },
});

module.exports = mongoose.model("Otp", OtpSchema);
