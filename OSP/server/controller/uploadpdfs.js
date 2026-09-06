const cloudinary = require("../config/cloud");
const fs = require("fs").promises;
const pool = require("../config/db");

// multer's fileFilter only checks the client-supplied MIME type, which is
// trivially spoofable. Verify the actual file content starts with the PDF
// magic bytes ("%PDF-") before trusting/uploading it anywhere.
const isActuallyPdf = async (filePath) => {
  const fileHandle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(5);
    await fileHandle.read(buffer, 0, 5, 0);
    return buffer.toString("ascii") === "%PDF-";
  } finally {
    await fileHandle.close();
  }
};

// Cloudinary upload function (Now Secure)
const uploadOnCloudinary = async (localFilePath, email) => {
  if (!localFilePath) return null;
  
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image", 
      type: "private", // SECURITY FIX: Makes the file completely inaccessible to the public internet
      folder: `osp_documents/${email.split('@')[0]}`, // Organize files securely by user
    });
    
    // Return the public_id, NOT the URL. We will store this ID in the database.
    return response.public_id; 
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return null; 
  } finally {
    try {
      await fs.unlink(localFilePath);
    } catch (fsError) {
      console.error("Error deleting local temporary file:", fsError);
    }
  }
};

const handeluploads = async (req, res) => {
  const { email, key } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No valid PDF file provided" });
  }

  const localFilePath = req.file.path;

  if (req.user.role !== "admin" && req.user.email !== email) {
    await fs.unlink(localFilePath).catch(() => {});
    return res.status(403).json({ message: "Forbidden: You do not have permission to upload documents for this account." });
  }

  const keyToDBColumnMap = {
    incomeCertificate: "income_certificate",
    bankPassbook: "bank_passbook",
    aadharcard: "aadhar_card", // Matches your database schema
    tuitionFeeReceipt: "tuition_fee_receipt",
    nonTuitionFeeReceipt: "non_tuition_fee_receipt",
    class10MarkSheet: "class_10_mark_sheet",
    class12MarkSheet: "class_12_mark_sheet",
    currentEducationMarkSheet: "current_education_mark_sheet",
  };

  const dbColumn = keyToDBColumnMap[key];

  if (!dbColumn) {
    await fs.unlink(localFilePath).catch(() => {});
    return res.status(400).json({ message: "Invalid document upload key" });
  }

  if (!(await isActuallyPdf(localFilePath))) {
    await fs.unlink(localFilePath).catch(() => {});
    return res.status(400).json({ message: "Invalid file type. Only PDF documents are allowed." });
  }

  try {
    // Look up whatever's currently stored so it can be cleaned up from
    // Cloudinary after a successful replacement, instead of being orphaned
    const existing = await pool.query(
      `SELECT ${dbColumn} FROM osp.applicant_documents WHERE email = $1`,
      [email]
    );
    const previousPublicId = existing.rows[0]?.[dbColumn] || null;

    // Pass email to organize folders
    const cloudinaryPublicId = await uploadOnCloudinary(localFilePath, email);

    if (!cloudinaryPublicId) {
      return res.status(500).json({ message: "File upload to Cloudinary failed" });
    }

    const updateQuery = `
        INSERT INTO osp.applicant_documents (email, ${dbColumn})
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE
        SET ${dbColumn} = EXCLUDED.${dbColumn};
    `;

    // Saving the public_id in the database, NOT the URL
    await pool.query(updateQuery, [email, cloudinaryPublicId]);

    if (previousPublicId && previousPublicId !== cloudinaryPublicId) {
      cloudinary.uploader
        .destroy(previousPublicId, { resource_type: "image", type: "private" })
        .catch((err) => console.error("Failed to delete replaced Cloudinary asset:", err));
    }

    return res.status(200).json({
      message: "File uploaded securely!",
      documentId: cloudinaryPublicId,
    });

  } catch (error) {
    console.error("Upload process error:", error);
    return res.status(500).json({ message: "Internal server error during upload" });
  }
};

module.exports = { handeluploads };