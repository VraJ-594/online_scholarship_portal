const pool = require("../config/db");

const fetchprofile = async (req, res, next) => {
  const email = req.params.email;
  
  const query = `
    SELECT
        a.first_name,
        a.middle_name,
        a.last_name,
        a.dob,
        a.gender,
        a.category,
        a.email,
        a.mobile_number AS "mobileNumber",
        a.parent_name,
        a.occupation,
        a.parent_mobile AS "parentMobile",
        a.income AS "incomelimit",
        addr.street_address AS "village",
        d.district_name AS "block",
        s.state_name AS "state",
        addr.pin_code AS "pin",
        a.bank_account_no AS "bankAccount",
        bd.ifsc_code AS "ifscCode",
        ifsc.bank_name,
        ifsc.branch_name,
        dp.program_name AS "courseLevel", 
        ed.department_name AS "courseName", 
        ed.tuition_fees AS "tuitionFees",
        ed.non_tuition_fees AS "nonTuitionFees",
        c10.institute_name AS "class10Institute",
        c10.passing_date AS "class10PassingDate",
        c10.marks_obtained AS "class10MarksObtained",
        c10.total_marks AS "class10TotalMarks",
        c12.institute_name AS "class12Institute",
        c12.passing_date AS "class12PassingDate",
        c12.marks_obtained AS "class12MarksObtained",
        c12.total_marks AS "class12TotalMarks",
        a.year_of_admission AS "currentEducationBatch",
        a.current_cgpa_obtained AS "currentCgpaObtained",
        a.current_cgpa_total AS "currentCgpaTotal",
        a.current_semester
    FROM osp.applicants a
    LEFT JOIN osp.users u ON a.email = u.email
    LEFT JOIN osp.addresses addr ON a.address_id = addr.address_id
    LEFT JOIN osp.districts d ON addr.district_id = d.district_id
    LEFT JOIN osp.states s ON d.state_id = s.state_id
    LEFT JOIN osp.Bank_Details bd ON a.bank_account_no = bd.bank_account_no
    LEFT JOIN osp.IFSC_Details ifsc ON bd.ifsc_code = ifsc.ifsc_code
    LEFT JOIN osp.Education_Details ed ON a.college_id = ed.college_id
    LEFT JOIN osp.Departments_with_Programs dp ON ed.department_name = dp.department_name
    LEFT JOIN osp.class10_details c10 ON a.applicant_id = c10.applicant_id
    LEFT JOIN osp.class12_details c12 ON a.applicant_id = c12.applicant_id
    WHERE a.email = $1;
  `;
  
  try {
    const { rows } = await pool.query(query, [email]);
    if (rows.length > 0) {
      return res.status(200).json(rows[0]);
    } else {
      return res.status(404).json({ message: "Profile data not found" });
    }
  } catch (error) {
    console.error("---> [fetchprofile] Error:", error.message);
    next(error);
  }
};

module.exports = { fetchprofile };