const { v2: cloudinary } = require("cloudinary");
require("dotenv").config(); // Ensure env variables are loaded if this file is called early

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;