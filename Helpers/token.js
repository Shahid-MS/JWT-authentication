const jwt = require("jsonwebtoken");
const generateAccesstoken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  return token;
};

const generateRefreshtoken = async (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "4h",
  });
  return token;
};

module.exports = {
  generateAccesstoken,
  generateRefreshtoken,
};
