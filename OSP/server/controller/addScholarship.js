const pool = require("../config/db");

const addScholarship = async (req, res) => {
  console.log("Reached addScholarship");
  // Destructuring the request body
  const {
    scholarshipName: scholarship_name,
    amount,
    endDate: end_date,
    description,
    educationLevel: education_level,
    eligibleCourses: eligible_courses,
    minPercentage: min_percentage,
    annualFamilyIncome: annual_family_income,
    benefits,
    note,
  } = req.body;
  // Input validation
  if (
    !scholarship_name ||
    !amount ||
    !end_date ||
    !description ||
    !education_level ||
    !eligible_courses ||
    !min_percentage ||
    !annual_family_income
  ) {
    console.error("Please Input all the Fields");
    return res.status(400).json("Please Input all the Fields");
  }

  try {
    // Generate a random scholarship ID (e.g., 'SCH12345')

    // Insert query for Scholarships table
    const insertQuery = `
  INSERT INTO osp.Scholarships (
   scholarship_name,
    amount,
    end_date,
    description,
    education_level,
    eligible_courses,
    min_percentage,
    annual_family_income,
    benefits,
    note
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
  ) RETURNING scholarship_id;`;

    // // converting to array in postgre format
    // const eligibleCoursesArray = `{${eligibleCourses.join(",")}}`;
    // const documentsRequiredArray = `{${documentsRequired.join(",")}}`;
    // Array of values for parameterized query
    const values = [
      scholarship_name,
      amount,
      end_date,
      description,
      education_level,
      eligible_courses,
      min_percentage,
      annual_family_income,
      benefits,
      note,
    ];

    // Execute the insert query
    const result = await pool.query(insertQuery, values);
    const scholarship_id = result.rows[0].scholarship_id;
    console.log(`Inserted scholarship: ${scholarship_name}`);
    res.status(200).json({
      message: "Scholarship added successfully",
      scholarship_id,
    });
  } catch (error) {
    console.error("Error inserting scholarship:", error.message);
    res.status(500).json({
      errMsg: "Internal Server Error",
    });
  }
};

module.exports = { addScholarship };
