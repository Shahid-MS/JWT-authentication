const jwt = require("jsonwebtoken");
const BlacklistToken = require("../Models/BlacklistToken");

const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      success: false,
      msg: "A Token is required",
    });
  }

  try {
    const bearer = token.split(" ");
    const bearerToken = bearer[1];

    const blacklist = await BlacklistToken.findOne({ token: bearerToken });

    if (blacklist) {
      return res.status(403).json({
        success: false,
        msg: "The session has expired",
      });
    }

    const decodedData = jwt.verify(
      bearerToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    req.user = decodedData;
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid Token",
    });
  }

  return next();
};

module.exports = verifyToken;
