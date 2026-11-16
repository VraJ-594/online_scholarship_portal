const pool = require("../config/db");

const getScholarship = async (req, res) => {
  console.log("Reached getScholarship hooray\n");
  const s_id = req.params.scholarship_id;
  try {
    const getQuery = `SELECT * FROM osp.Scholarships WHERE scholarship_id = $1 AND deleted_at IS NULL`;
    const response = await pool.query(getQuery, [s_id]);
    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Scholarship not found." });
    }
    res.status(200).json(response.rows[0]); // Send only one response
  } catch (error) {
    console.error("Error getting scholarship :", error.message);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  }
};
module.exports = { getScholarship };
