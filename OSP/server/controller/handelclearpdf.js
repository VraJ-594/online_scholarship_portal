const pool = require("../config/db");

const handelclearpdf = async (req, res) => {
    const { email, id } = req.params;
  
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

      try {
        
        const query = `
          UPDATE osp.applicant_documents
          SET ${columnName} = null
          WHERE email = $1
        `;
    
        const result = await pool.query(query, [email]);
    
        if (result.rowCount === 0) {
          return res.status(404).json({ message: "No record found for the given email" });
        }
    
        return res.status(200).json({ message: `Document '${id}' cleared successfully` });
      } 
      catch (error) {
        console.error("Error clearing document:", error);
        return res.status(500).json({ message: "Server error clearing document" });
      }
    


  
};

module.exports = { handelclearpdf };
