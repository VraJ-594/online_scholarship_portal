const pool = require("../config/db");

const handelpdfurls = async (req, res) => {
  const { email } = req.params; // Get the email ID from the URL parameters

  try {
    // Query the database for the document URLs
    const query = `
      SELECT 
        income_certificate,
        bank_passbook,
        aadhar_card,
        tuition_fee_receipt,
        non_tuition_fee_receipt,
        class_10_mark_sheet,
        class_12_mark_sheet,
        current_education_mark_sheet
      FROM osp.applicant_documents
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      // No documents found for the given email
      return res
        .status(404)
        .json({ message: "No documents found for this email ID." });
    }

    const documentUrls = result.rows[0];

    //console.log(documentUrls);


    // Map the database fields to the client-side state structure
    const responseJson = {
      incomeCertificate: documentUrls.income_certificate || null,
      bankPassbook: documentUrls.bank_passbook || null,
      aadharcard: documentUrls.aadhar_card || null,
      tuitionFeeReceipt: documentUrls.tuition_fee_receipt || null,
      nonTuitionFeeReceipt: documentUrls.non_tuition_fee_receipt || null,
      class10MarkSheet: documentUrls.class_10_mark_sheet || null,
      class12MarkSheet: documentUrls.class_12_mark_sheet || null,
      currentEducationMarkSheet: documentUrls.current_education_mark_sheet || null,
    };

    //console.log(responseJson);

    // Send the response
    res.status(200).json(responseJson);
  } catch (error) {
    console.error("Error fetching document URLs:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { handelpdfurls };
