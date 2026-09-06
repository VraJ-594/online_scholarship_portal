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
    // Delete query for Scholarships table
    const deleteQuery1 = `DELETE FROM osp.applied_in WHERE scholarship_id = $1`;
    const deleteQuery = `
      DELETE FROM osp.Scholarships
      WHERE scholarship_id = $1
    `;

    // Execute the delete query
    await pool.query(deleteQuery1, [scholarship_id]);
    const result = await pool.query(deleteQuery, [scholarship_id]);

    if (result.rowCount === 0) {
      console.error("Scholarship not found");
      return res.status(404).json("Scholarship not found");
    }

    console.log(`Deleted scholarship with ID: ${scholarship_id}`);
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
