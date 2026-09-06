const pool = require("../config/db");
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});

// Define the valid state transition flow
const VALID_TRANSITIONS = {
  "Pending": ["Under Review", "Rejected"],
  "Under Review": ["Documents Verified", "Rejected"],
  "Documents Verified": ["Accepted", "Rejected"],
  "Accepted": [], // Terminal state
  "Rejected": [], // Terminal state
};

const statusUpdate = async (req, res, next) => {
  console.log("---> [statusUpdate] Reached statusUpdate controller");
  const { applicant_id, s_id, statusToUpdate } = req.body;

  if (!applicant_id || !s_id || !statusToUpdate) {
    return res.status(400).json({ message: "Missing required fields: applicant_id, s_id, or statusToUpdate." });
  }

  try {
    // 1. FETCH CURRENT STATUS FROM DATABASE
    const currentStatusQuery = `
      SELECT status FROM osp.applied_in 
      WHERE applicant_id = $1 AND scholarship_id = $2;
    `;
    const currentResult = await pool.query(currentStatusQuery, [applicant_id, s_id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: "Application record not found for this student and scholarship." });
    }

    const currentStatus = currentResult.rows.length > 0 && currentResult.rows[0].status 
      ? currentResult.rows[0].status 
      : "Pending";

    // 2. STATE MACHINE VALIDATION & PRECISE ERROR MESSAGING
    const allowedNextStates = VALID_TRANSITIONS[currentStatus] || [];
    
    // Allow saving the exact same status without triggering an error
    if (currentStatus !== statusToUpdate && !allowedNextStates.includes(statusToUpdate)) {
      console.warn(`---> [statusUpdate] Illegal transition blocked: ${currentStatus} -> ${statusToUpdate}`);
      
      let specificHint = `Allowed next steps from '${currentStatus}' are: ${allowedNextStates.join(", ")}.`;
      if (currentStatus === "Accepted" || currentStatus === "Rejected") {
        specificHint = `This application is already in a terminal state ('${currentStatus}'). Its status can no longer be modified.`;
      } else if (statusToUpdate === "Accepted" && currentStatus !== "Documents Verified") {
        specificHint = "Applications must have their documents verified before they can be accepted.";
      }

      return res.status(400).json({ 
        message: `Invalid review cycle transition. Cannot move status from '${currentStatus}' to '${statusToUpdate}'. ${specificHint}` 
      });
    }

    // 3. UPDATE THE STATUS IN THE DATABASE
    const updateQuery = `
      UPDATE osp.applied_in
      SET status = $1
      WHERE applicant_id = $2 AND scholarship_id = $3;
    `;
    await pool.query(updateQuery, [statusToUpdate, applicant_id, s_id]);

    // 4. FETCH STUDENT AND SCHOLARSHIP DETAILS FOR THE EMAIL
    const detailsQuery = `
      SELECT a.email, a.first_name, s.scholarship_name
      FROM osp.applicants a
      CROSS JOIN osp.Scholarships s
      WHERE a.applicant_id = $1 AND s.scholarship_id = $2;
    `;
    const detailsResult = await pool.query(detailsQuery, [applicant_id, s_id]);

    if (detailsResult.rows.length > 0) {
      const studentEmail = detailsResult.rows[0].email;
      const studentName = detailsResult.rows[0].first_name;
      const scholarshipName = detailsResult.rows[0].scholarship_name;

      let statusColor = "#007BFF";
      if (statusToUpdate.toLowerCase().includes("accept")) statusColor = "#28a745";
      if (statusToUpdate.toLowerCase().includes("reject")) statusColor = "#dc3545";
      if (statusToUpdate.toLowerCase().includes("review") || statusToUpdate.toLowerCase().includes("verified")) statusColor = "#ffc107";

      const mailOptions = {
        from: `"OSP Portal" <${process.env.user}>`,
        to: studentEmail,
        subject: `Application Status Update: ${scholarshipName}`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f8fb;">
          <div style="background-color: ${statusColor}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Application Update</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p style="font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
            <p style="font-size: 16px;">Your application status for <strong>${scholarshipName}</strong> has been updated.</p>
            
            <div style="text-align: center; margin: 30px 0; padding: 15px; border: 2px dashed ${statusColor}; border-radius: 8px; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase;">Current Status</p>
              <h2 style="margin: 10px 0 0 0; color: ${statusColor}; font-size: 24px;">${statusToUpdate}</h2>
            </div>
            
            <p style="font-size: 16px;">Log in to your portal for more details.</p>
            <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br><strong>The OSP Team</strong></p>
          </div>
        </body>
        </html>
        `,
      };

      transport.sendMail(mailOptions).catch((emailErr) => {
        console.error("---> [statusUpdate] Non-fatal Email Error:", emailErr.message);
      });
    }

    return res.status(200).json({ message: "Status updated successfully according to workflow cycle." });

  } catch (error) {
    console.error("---> [statusUpdate] Error:", error.message);
    next(error);
  }
};

module.exports = { statusUpdate };