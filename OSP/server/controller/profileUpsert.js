const pool = require("../config/db");

const handleProfileData = async (req, res, next) => {
  const formData = req.body;
  const email = formData.email;

  if (req.user.role !== "admin" && req.user.email !== email) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to modify this profile." });
  }

  // Grab a dedicated client from the pool to run a Transaction
  const client = await pool.connect();

  try {
    console.log(`---> [userprofile] Starting database transaction for ${email}`);
    await client.query('BEGIN'); // START TRANSACTION

    // 1. STATE
    // Upsert-and-return in one round trip instead of SELECT-then-conditional-INSERT
    // (the ON CONFLICT DO UPDATE is a harmless self-assignment purely so RETURNING
    // works whether the row already existed or was just inserted)
    const stateRes = await client.query(
      `INSERT INTO osp.states (state_name) VALUES ($1)
       ON CONFLICT (state_name) DO UPDATE SET state_name = EXCLUDED.state_name
       RETURNING state_id`,
      [formData.state]
    );
    const stateId = stateRes.rows[0].state_id;

    // 2. DISTRICT
    const distRes = await client.query(
      `INSERT INTO osp.districts (district_name, state_id) VALUES ($1, $2)
       ON CONFLICT (district_name, state_id) DO UPDATE SET district_name = EXCLUDED.district_name
       RETURNING district_id`,
      [formData.block, stateId]
    );
    const districtId = distRes.rows[0].district_id;

    // 3. ADDRESS
    let addressId;
    const addrResult = await client.query("SELECT address_id FROM osp.addresses WHERE street_address = $1 AND pin_code = $2 AND district_id = $3", [formData.village, formData.pin, districtId]);
    if (addrResult.rows.length > 0) addressId = addrResult.rows[0].address_id;
    else {
      const res = await client.query("INSERT INTO osp.addresses (street_address, pin_code, district_id) VALUES ($1, $2, $3) RETURNING address_id", [formData.village, formData.pin, districtId]);
      addressId = res.rows[0].address_id;
    }

    // 4. IFSC DETAILS (ifsc_code is already the primary key, so a plain
    // ON CONFLICT DO NOTHING is enough -- nothing downstream needs its row back)
    let ifscCode = formData.ifscCode;
    await client.query(
      `INSERT INTO osp.IFSC_Details (ifsc_code, bank_name, branch_name) VALUES ($1, $2, $3)
       ON CONFLICT (ifsc_code) DO NOTHING`,
      [ifscCode, formData.bankName, formData.bankBranch]
    );

    // 5. BANK DETAILS (bank_account_no is already the primary key)
    let bankAccountNo = formData.bankAccount;
    await client.query(
      `INSERT INTO osp.Bank_Details (bank_account_no, ifsc_code) VALUES ($1, $2)
       ON CONFLICT (bank_account_no) DO NOTHING`,
      [bankAccountNo, ifscCode]
    );

    // 6. DEPARTMENT / COURSE (department_name is already the primary key; this also
    // fixes a latent bug where resubmitting an existing department with a different
    // program_name would hit a duplicate-key error instead of updating the mapping)
    const deptRes = await client.query(
      `INSERT INTO osp.Departments_with_Programs (department_name, program_name) VALUES ($1, $2)
       ON CONFLICT (department_name) DO UPDATE SET program_name = EXCLUDED.program_name
       RETURNING department_name`,
      [formData.courseName, formData.courseLevel]
    );
    const departmentName = deptRes.rows[0].department_name;

    // 7. EDUCATION DETAILS (College)
    let collegeId;
    const eduResult = await client.query("SELECT college_id FROM osp.Education_Details WHERE department_name = $1 AND tuition_fees = $2 AND non_tuition_fees = $3", [departmentName, formData.tuitionFees, formData.nonTuitionFees]);
    if (eduResult.rows.length > 0) collegeId = eduResult.rows[0].college_id;
    else {
      const res = await client.query("INSERT INTO osp.Education_Details (department_name, tuition_fees, non_tuition_fees) VALUES ($1, $2, $3) RETURNING college_id", [departmentName, formData.tuitionFees, formData.nonTuitionFees]);
      collegeId = res.rows[0].college_id;
    }

    // 8. APPLICANT UPSERT
    const insertOrUpdateApplicantQuery = `
        INSERT INTO osp.applicants (
            first_name, middle_name, last_name, dob, gender, category, email,
            mobile_number, parent_name, occupation, income, parent_mobile, current_semester,
            year_of_admission, current_cgpa_obtained, current_cgpa_total, address_id, bank_account_no, college_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (email)
        DO UPDATE SET
            first_name = EXCLUDED.first_name,
            middle_name = EXCLUDED.middle_name,
            last_name = EXCLUDED.last_name,
            dob = EXCLUDED.dob,
            gender = EXCLUDED.gender,
            category = EXCLUDED.category,
            mobile_number = EXCLUDED.mobile_number,
            parent_name = EXCLUDED.parent_name,
            occupation = EXCLUDED.occupation,
            income = EXCLUDED.income,
            parent_mobile = EXCLUDED.parent_mobile,
            current_semester = EXCLUDED.current_semester,
            year_of_admission = EXCLUDED.year_of_admission,
            current_cgpa_obtained = EXCLUDED.current_cgpa_obtained,
            current_cgpa_total = EXCLUDED.current_cgpa_total,
            address_id = EXCLUDED.address_id,
            bank_account_no = EXCLUDED.bank_account_no,
            college_id = EXCLUDED.college_id
        RETURNING applicant_id;
    `;

    const applicantResult = await client.query(insertOrUpdateApplicantQuery, [
      formData.firstname, formData.middlename, formData.lastname, formData.dob, formData.gender, formData.category, email,
      formData.mobileNumber, formData.parentName, formData.occupation, formData.incomelimit, formData.parentMobile, formData.currentSemester,
      formData.currentEducationBatch, formData.currentCgpaObtained, formData.currentCgpaTotal, addressId, bankAccountNo, collegeId,
    ]);

    const applicantId = applicantResult.rows[0].applicant_id;

    // 9. CLASS 10 UPSERT
    const class10Query = `
        INSERT INTO osp.class10_details (applicant_id, institute_name, passing_date, marks_obtained, total_marks)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (applicant_id) DO UPDATE SET
            institute_name = EXCLUDED.institute_name, passing_date = EXCLUDED.passing_date,
            marks_obtained = EXCLUDED.marks_obtained, total_marks = EXCLUDED.total_marks;
    `;
    await client.query(class10Query, [applicantId, formData.class10Institute, formData.class10PassingDate, formData.class10MarksObtained, formData.class10TotalMarks]);

    // 10. CLASS 12 UPSERT
    const class12Query = `
        INSERT INTO osp.class12_details (applicant_id, institute_name, passing_date, marks_obtained, total_marks)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (applicant_id) DO UPDATE SET
            institute_name = EXCLUDED.institute_name, passing_date = EXCLUDED.passing_date,
            marks_obtained = EXCLUDED.marks_obtained, total_marks = EXCLUDED.total_marks;
    `;
    await client.query(class12Query, [applicantId, formData.class12Institute, formData.class12PassingDate, formData.class12MarksObtained, formData.class12TotalMarks]);

    // ALL QUERIES SUCCEEDED. COMMIT CHANGES TO DATABASE!
    await client.query('COMMIT');
    console.log(`---> [userprofile] Transaction successful for ${email}`);
    
    return res.status(200).json({ message: "Profile saved successfully!", success: true });

  } catch (error) {
    // IF ANYTHING FAILS, ERASE ALL PARTIAL CHANGES
    await client.query('ROLLBACK');
    console.error("---> [userprofile] TRANSACTION FAILED & ROLLED BACK:", error.message);
    next(error); 
  } finally {
    // VERY IMPORTANT: Return the client to the pool so the server doesn't freeze
    client.release();
  }
};

module.exports = { handleProfileData };