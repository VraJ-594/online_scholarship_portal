const jwt = require("jsonwebtoken");

const generateToken = (data) => {
  return jwt.sign(data, process.env.token_api, { expiresIn: "30d" });
};

module.exports = generateToken;
