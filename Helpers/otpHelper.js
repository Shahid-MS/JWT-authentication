exports.otpGenerator = () => {
  const sixDigitOtp = Math.floor(100000 + Math.random() * 900000);
  return sixDigitOtp;
};

exports.oneMinOtpExpiry = async (otpTime) => {
  try {
    // console.log("timestamp is ", otpTime);
    const currTime = new Date();
    let diffTime = (currTime.getTime() - otpTime) / 1000;
    diffTime /= 60;
    // console.log(diffTime);
    if (diffTime > 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
  }
};

exports.threeMinOtpExpiry = async (otpTime) => {
  try {
    // console.log("timestamp is ", otpTime);
    const currTime = new Date();
    let diffTime = (currTime.getTime() - otpTime) / 1000;
    diffTime /= 60;
    // console.log(diffTime);
    if (diffTime > 3) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
  }
};
