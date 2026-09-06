const pool = require("../config/db");

const applyForScholarship = async (req, res, next) => {
  console.log("---> [applyForScholarship] Starting application process...");

  // Support taking scholarship_id from URL params (as defined in your routes) or body
  const scholarship_id = req.params.scholarship_id || req.body.scholarship_id;
  const { applicant_id, applied_date, status } = req.body;

  if (!scholarship_id || !applicant_id || !applied_date || !status) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }

  try {
    // ========================================================================
    // 1. FETCH SCHOLARSHIP REQUIREMENTS
    // ========================================================================
    const scholarshipQuery = `
      SELECT min_percentage, annual_family_income, education_level, eligible_courses 
      FROM osp.Scholarships 
      WHERE scholarship_id = $1
    `;
    const scholarshipRes = await pool.query(scholarshipQuery, [scholarship_id]);
    
    if (scholarshipRes.rows.length === 0) {
      return res.status(404).json({ message: "Scholarship not found." });
    }
    const scholarship = scholarshipRes.rows[0];

    // ========================================================================
    // 2. FETCH APPLICANT PROFILE DATA
    // ========================================================================
    // We join with Education_Details and Departments to get their exact course
    const applicantQuery = `
      SELECT 
          a.income,
          a.current_cgpa_obtained,
          dp.program_name AS education_level,
          ed.department_name AS course_name
      FROM osp.applicants a
      LEFT JOIN osp.Education_Details ed ON a.college_id = ed.college_id
      LEFT JOIN osp.Departments_with_Programs dp ON ed.department_name = dp.department_name
      WHERE a.applicant_id = $1
    `;
    const applicantRes = await pool.query(applicantQuery, [applicant_id]);

    if (applicantRes.rows.length === 0) {
      return res.status(404).json({ message: "Applicant profile not found. Please complete your profile first." });
    }
    const applicant = applicantRes.rows[0];

    // ========================================================================
    // 3. STRICT BUSINESS LOGIC VALIDATION
    // ========================================================================
    const validationErrors = [];

    // A. Family Income Check
    if (parseFloat(applicant.income || 0) > parseFloat(scholarship.annual_family_income)) {
      validationErrors.push(`Your family income (₹${applicant.income}) exceeds the maximum limit (₹${scholarship.annual_family_income}).`);
    }

    // B. Minimum CPI / Percentage Check
    if (parseFloat(applicant.current_cgpa_obtained || 0) < parseFloat(scholarship.min_percentage)) {
      validationErrors.push(`Your current CPI (${applicant.current_cgpa_obtained}) is below the required minimum (${scholarship.min_percentage}).`);
    }

    // C. Education Level Check (e.g., B.Tech vs M.Tech)
    if (applicant.education_level !== scholarship.education_level) {
      validationErrors.push(`This scholarship is for ${scholarship.education_level} students, but you are enrolled in ${applicant.education_level || "an unlisted program"}.`);
    }

    // D. Eligible Courses Check
    let parsedCourses = [];
    try {
      // Handle Postgres array mapping to JS safely
      parsedCourses = typeof scholarship.eligible_courses === 'string' 
        ? JSON.parse(scholarship.eligible_courses) 
        : scholarship.eligible_courses;
    } catch (e) {
      parsedCourses = [];
    }

    if (parsedCourses && parsedCourses.length > 0 && !parsedCourses.includes(applicant.course_name)) {
      validationErrors.push(`Your specific course (${applicant.course_name || "Unlisted"}) is not eligible for this scholarship.`);
    }

    // -> IF ANY CHECKS FAILED, REJECT IMMEDIATELY
    if (validationErrors.length > 0) {
      console.warn(`---> [applyForScholarship] Rejected Application. Reasons: ${validationErrors.join(" | ")}`);
      return res.status(403).json({ 
        message: "You do not meet the eligibility criteria for this scholarship.\n\n" + validationErrors.join("\n") 
      });
    }

    // ========================================================================
    // 4. PASSED ALL CHECKS -> INSERT INTO DATABASE
    // ========================================================================
    const insertQuery = `
      INSERT INTO osp.applied_in (scholarship_id, applicant_id, applied_date, status) 
      VALUES ($1, $2, $3, $4)
    `;
    const values = [scholarship_id, applicant_id, applied_date, status];

    await pool.query(insertQuery, values);
    
    console.log(`---> [applyForScholarship] Success! Application inserted for Scholarship ID: ${scholarship_id}`);
    
    return res.status(200).json({
      message: "Application submitted successfully!",
      scholarship_id,
    });

  } catch (error) {
    // Catch Postgres UNIQUE CONSTRAINT violation (Error 23505: student already applied)
    if (error.code === '23505') {
      console.warn(`---> [applyForScholarship] Duplicate application attempt blocked.`);
      return res.status(409).json({ message: "You have already applied for this scholarship." });
    }
    
    console.error("---> [applyForScholarship] System Error:", error.message);
    next(error); // Pass to global error handler
  }
};

module.exports = { applyForScholarship };