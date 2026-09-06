const pool = require("../config/db");

const getListforApplyscholarships = async (req, res) => {
  console.log("Reached getListforApplyScholarships");

  try {
    const getQuery = `SELECT scholarship_id,scholarship_name,end_date,amount FROM osp.Scholarships`;

    //     const getQuery2 = `SELECT
    //     s.scholarship_id,
    //     s.scholarship_name,
    //     s.amount,
    //     s.end_date,
    //     COUNT(a.applicant_id) AS applicants_count
    // FROM
    //     osp.scholarships AS s
    // LEFT JOIN
    //     osp.applied_in AS a
    // ON
    //     s.scholarship_id = a.scholarship_id
    // GROUP BY
    //     s.scholarship_id, s.scholarship_name, s.amount, s.end_date
    // ORDER BY
    //     applicants_count DESC;
    // `;

    const response = await pool.query(getQuery);
    // console.log(response.rows);

    res.status(200).json(response.rows); // Send only one response
  } catch (error) {
    console.error("Error getting scholarship list:", error);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  }
};
module.exports = { getListforApplyscholarships };
