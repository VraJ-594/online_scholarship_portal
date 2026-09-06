const pool = require("../config/db");

const getApplicantsData = async (req, res) => {
  console.log("Reached getApplicantData");

  const student_id = req.query.id;
  const scholarship_id = req.query.scholarship_id;

  try {
    let getQuery = `
    SELECT 
      a.applicant_id,
      a.first_name,
      a.middle_name,
      a.last_name,
      a.dob,
      a.gender,
      a.category,
      a.email,
      a.mobile_number,
      a.parent_name,
      a.occupation,
      a.income,
      a.parent_mobile,
      a.current_semester,
      a.year_of_admission,
      a.current_cgpa_obtained,
      a.current_cgpa_total,
      a.address_id,
      a.bank_account_no,
      a.college_id,
      ad.street_address,
      ad.pin_code,
      d.district_name,
      e.college_id,
      e.department_name,
      e.tuition_fees,
      e.non_tuition_fees,
      ai.status, -- Status column from applied_in table
      doc.income_certificate,
      doc.bank_passbook,
      doc.aadhar_card,
      doc.tuition_fee_receipt,
      doc.non_tuition_fee_receipt,
      doc.class_10_mark_sheet,
      doc.class_12_mark_sheet,
      doc.current_education_mark_sheet
    FROM 
      osp.applicants a
    LEFT JOIN 
      osp.addresses ad ON a.address_id = ad.address_id
    LEFT JOIN 
      osp.districts d ON ad.district_id = d.district_id
    LEFT JOIN 
      osp.education_details e ON a.college_id = e.college_id
    LEFT JOIN 
      osp.applied_in ai ON a.applicant_id = ai.applicant_id
    LEFT JOIN 
      osp.applicant_documents doc ON a.email = doc.email -- Join with applicant_documents
    WHERE
      a.applicant_id = $1
      AND ai.scholarship_id = $2; -- Condition for scholarship_id
    `;

    const response = await pool.query(getQuery, [student_id, scholarship_id]);
    return res.status(200).json({ data: response.rows });
  } catch (error) {
    console.error("Error getting Applicants data:", error);
    return res.status(500).json({ errMsg: "Internal Server Error" });
  }
};

module.exports = { getApplicantsData };
