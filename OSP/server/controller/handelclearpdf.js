const pool = require("../config/db");
const cloudinary = require("../config/cloud");

const handelclearpdf = async (req, res) => {
    const { email, id } = req.params;

    if (req.user.role !== "admin" && req.user.email !== email) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to modify these documents." });
    }

    const idToColumnMap = {
        incomeCertificate: "income_certificate",
        bankPassbook: "bank_passbook",
        aadharcard: "aadhar_card",
        tuitionFeeReceipt: "tuition_fee_receipt",
        nonTuitionFeeReceipt: "non_tuition_fee_receipt",
        class10MarkSheet: "class_10_mark_sheet",
        class12MarkSheet: "class_12_mark_sheet",
        currentEducationMarkSheet: "current_education_mark_sheet",
      };
      
      const columnName = idToColumnMap[id];

      if (!columnName) {
        return res.status(400).json({ message: "Invalid document type requested." });
      }

      try {

        // Grab the Cloudinary asset id being cleared so it can be deleted
        // from storage too, instead of only unlinking it in the database
        const existing = await pool.query(
          `SELECT ${columnName} FROM osp.applicant_documents WHERE email = $1`,
          [email]
        );
        const publicIdToDelete = existing.rows[0]?.[columnName] || null;

        const query = `
          UPDATE osp.applicant_documents
          SET ${columnName} = null
          WHERE email = $1
        `;

        const result = await pool.query(query, [email]);

        if (result.rowCount === 0) {
          return res.status(404).json({ message: "No record found for the given email" });
        }

        if (publicIdToDelete) {
          cloudinary.uploader
            .destroy(publicIdToDelete, { resource_type: "image", type: "private" })
            .catch((err) => console.error("Failed to delete cleared Cloudinary asset:", err));
        }

        return res.status(200).json({ message: `Document '${id}' cleared successfully` });
      }
      catch (error) {
        console.error("Error clearing document:", error);
        return res.status(500).json({ message: "Server error clearing document" });
      }
    


  
};

module.exports = { handelclearpdf };
