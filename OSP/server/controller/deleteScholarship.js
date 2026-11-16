const pool = require("../config/db");

const deleteScholarship = async (req, res) => {
  console.log("Reached deleteScholarship");

  // Destructure scholarshipId from request body
  // console.log(req.params);
  const scholarship_id = req.params.scholarship_id;
  // console.log(scholarship_id);

  // Input validation
  // if (!scholarship_id) {
  //   console.error("Scholarship ID is required");
  //   return res.status(400).json("Scholarship ID is required");
  // }

  try {
    // Keep the scholarship, applications and payments for historical review.
    // A single conditional UPDATE is atomic, including concurrent deletions.
    const result = await pool.query(`
      UPDATE osp.scholarships
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE scholarship_id = $1 AND deleted_at IS NULL
    `, [scholarship_id]);

    if (result.rowCount === 0) {
      console.error("Scholarship not found");
      return res.status(404).json("Scholarship not found");
    }

    console.log(`Soft-deleted scholarship with ID: ${scholarship_id}`);
    res.status(200).json({
      message: "Scholarship deleted successfully",
      scholarship_id,
    });
  } catch (error) {
    console.error("Error deleting scholarship:", error.message);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  }
};

module.exports = { deleteScholarship };
