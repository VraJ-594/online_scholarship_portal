const pool = require("../config/db");

const getAppliedScholarships = async (req, res) => {
  console.log("Reached getAppliedScholarships");
  const email = req.headers.email;

  try {
    const getQuery2 = `  SELECT 
        s.scholarship_id,
        s.scholarship_name,
        s.amount,
        a.applied_date,
        a.status,
        a.applicant_id,
        s.end_date
      FROM 
        osp.scholarships AS s
      NATURAL JOIN 
        osp.applied_in AS a
      NATURAL JOIN 
        osp.applicants AS app
      NATURAL JOIN 
        osp.users AS u
      WHERE 
        u.email = $1
`;
    const response = await pool.query(getQuery2, [email]);
    // console.log(response.rows);

    res.status(200).json(response.rows); // Send only one response
  } catch (error) {
    console.error("Error getting scholarships list:", error);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  }
};
module.exports = { getAppliedScholarships };
