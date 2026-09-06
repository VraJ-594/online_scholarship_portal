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

  // Run both deletes in one transaction so a failure partway through can't
  // leave applications deleted while the scholarship row survives (or vice versa)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM osp.applied_in WHERE scholarship_id = $1`, [scholarship_id]);
    const result = await client.query(`DELETE FROM osp.Scholarships WHERE scholarship_id = $1`, [scholarship_id]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      console.error("Scholarship not found");
      return res.status(404).json("Scholarship not found");
    }

    await client.query("COMMIT");
    console.log(`Deleted scholarship with ID: ${scholarship_id}`);
    res.status(200).json({
      message: "Scholarship deleted successfully",
      scholarship_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting scholarship:", error.message);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  } finally {
    client.release();
  }
};

module.exports = { deleteScholarship };
