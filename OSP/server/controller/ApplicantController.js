const pool = require("../config/db");

const getListOfScholarships = async (req, res) => {
  console.log("Reached getListOfScholarships");
  try {
    const query = `
      SELECT 
        s.scholarship_id AS id,
        s.scholarship_name AS name,
        COUNT(ai.applicant_id) AS numApplicants,
        s.start_date,  -- Added start date
        s.end_date,    -- Added end date
        MAX(ai.status) AS status  -- Added status (taking the latest status for the scholarship)
      FROM 
        osp.Scholarships s
      LEFT JOIN 
        osp.Applied_in ai ON s.scholarship_id = ai.scholarship_id
      GROUP BY 
        s.scholarship_id, s.scholarship_name, s.start_date, s.end_date
      ORDER BY 
        s.scholarship_id;
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getApplicantsByScholarshipId = async (req, res) => {
  const scholarshipId = req.params.id; 
  // console.log(scholarshipId);
  console.log("In application controller, get scholarship by id");
  try {
    const query = `
      SELECT 
        a.applicant_id AS id,
        CONCAT(a.first_name, ' ', COALESCE(a.middle_name, ''), ' ', a.last_name) AS student_name,
        ai.applied_date,
        s.end_date,
        ai.status  -- Added status column to show the application status
      FROM 
        osp.applicants a
      INNER JOIN 
        osp.applied_in ai ON a.applicant_id = ai.applicant_id
      INNER JOIN 
        osp.scholarships s ON ai.scholarship_id = s.scholarship_id
      WHERE 
        s.scholarship_id = $1
      ORDER BY 
        ai.applied_date;
    `;
    
    const result = await pool.query(query, [scholarshipId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ error: "Failed to fetch applicants." });
  }
};

module.exports = {
  getListOfScholarships,
  getApplicantsByScholarshipId
};
