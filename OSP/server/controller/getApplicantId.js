const pool = require("../config/db");

const getApplicantId = async (req, res) => {
  console.log("Reached getApplicant ID");

  const email = req.headers.email;

  try {
    let getQuery = `
    SELECT osp.applicants.applicant_id from osp.applicants where osp.applicants.email = $1`;

    const response = await pool.query(getQuery, [email]);
    console.log(response.rows[0]);
    return res.status(200).json({ applicant: response.rows[0] });
  } catch (error) {
    console.error("Error getting Applicants data:", error);
    return res.status(500).json({ errMsg: "Internal Server Error" });
  }
};

module.exports = { getApplicantId };
