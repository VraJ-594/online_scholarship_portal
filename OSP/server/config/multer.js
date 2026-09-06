const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Resolve relative to this file, not the process's working directory, and
// create the folder automatically instead of requiring it to pre-exist
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize the filename to prevent path traversal attacks (e.g., ../../)
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

// Enforce PDF-only uploads for documents
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    // Reject file
    cb(new Error("Invalid file type. Only PDF documents are allowed."), false);
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum file size
  fileFilter 
});

module.exports = upload;