const cloudinary = require("../config/cloud");
const pool = require("../config/db");

const getSecureDocumentUrl = async (req, res, next) => {
  console.log(`---> [viewDocument] Starting secure URL generation...`);
  
  try {
    const targetEmail = req.params.studentEmail; 
    const frontendDocumentKey = req.params.documentType; 
    
    console.log(`---> [viewDocument] Target Email: ${targetEmail}, Frontend Key: ${frontendDocumentKey}`);

    // SAFETY CHECK: Ensure JWT authentication is actually running
    if (!req.user) {
      console.error("---> [viewDocument] ERROR: req.user is undefined.");
      return res.status(401).json({ message: "Authentication required." });
    }

    const requesterEmail = req.user.email; 
    const requesterRole = req.user.role; 

    // 1. AUTHORIZATION CHECK
    if (requesterRole !== "admin" && requesterEmail !== targetEmail) {
      console.warn(`---> [viewDocument] Unauthorized attempt by ${requesterEmail}`);
      return res.status(403).json({ message: "Forbidden: You do not have permission to view this document." });
    }

    // ====================================================================
    // 2. THE FIX: STRICT WHITELIST & DB COLUMN MAPPER
    // ====================================================================
    const keyToDBColumnMap = {
      incomeCertificate: "income_certificate",
      bankPassbook: "bank_passbook",
      aadharcard: "aadhar_card",
      tuitionFeeReceipt: "tuition_fee_receipt",
      nonTuitionFeeReceipt: "non_tuition_fee_receipt",
      class10MarkSheet: "class_10_mark_sheet",
      class12MarkSheet: "class_12_mark_sheet",
      currentEducationMarkSheet: "current_education_mark_sheet",
    };

    const dbColumn = keyToDBColumnMap[frontendDocumentKey];

    // Block invalid or malicious column names immediately
    if (!dbColumn) {
      console.warn(`---> [viewDocument] Invalid document type requested: ${frontendDocumentKey}`);
      return res.status(400).json({ message: "Invalid document type requested." });
    }

    console.log(`---> [viewDocument] Mapped to DB Column: ${dbColumn}. Querying PostgreSQL...`);

    // 3. FETCH FROM DATABASE
    // Safe interpolation: dbColumn is strictly controlled by our backend dictionary
    const query = `SELECT ${dbColumn} FROM osp.applicant_documents WHERE email = $1`;
    const result = await pool.query(query, [targetEmail]);

    if (result.rows.length === 0 || !result.rows[0][dbColumn]) {
      console.warn(`---> [viewDocument] Document not found in database.`);
      return res.status(404).json({ message: "Document not found." });
    }

    const publicId = result.rows[0][dbColumn];
    console.log(`---> [viewDocument] Found Cloudinary ID: ${publicId}. Generating signed URL...`);

    // 4. GENERATE SIGNED URL
    const expiresAt = Math.floor(Date.now() / 1000) + 900; // 15 minutes

    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      type: "private",
      expires_at: expiresAt,
    });

    console.log(`---> [viewDocument] Success! URL generated. Sending to frontend.`);
    return res.status(200).json({ url: signedUrl });

  } catch (error) {
    console.error("---> [viewDocument] EXCEPTION CAUGHT:");
    next(error); 
  }
};

module.exports = { getSecureDocumentUrl };