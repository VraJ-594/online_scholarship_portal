const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const nodemailer = require("nodemailer");
var transport = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.user,
    pass: process.env.pass,
  },
});
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const emailSender = async (req, res) => {
  console.log("Reached emailSender");
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const user = await pool.query("SELECT * FROM osp.users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    await pool.query(
      "INSERT INTO osp.forgot_pass (email, otp, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (email) DO UPDATE SET otp = $2, created_at = NOW()",
      [email, hashedOTP]
    );
    // Send the OTP via email
    try {
      const mailOptions = {
        from: "<no-reply>osp_password_reset",
        to: email,
        subject: "Your OTP for Password Reset",
        text: `Your OTP for password reset is: ${otp}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f8fb;">
  <div style="background-color: #007BFF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">OTP Verification</h1>
  </div>
  <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Your one-time password (OTP) is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 36px; font-weight: bold; color: #007BFF;">${otp}</span>
    </div>
    <p>Please use this code to proceed with your verification. This OTP will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>Flip The Page</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 0.85em;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>`,
      };
      const info = await transport.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
      res.status(201).json({
        message:
          "OTP generated and sent to your email. Please check your inbox.",
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      res.status(500).json({
        message: "Error sending the OTP email. Please try again later.",
        emailError,
      });
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const validateOTP = async (req, res) => {
  console.log("Reached VerifyOTP");
  const { email, otp } = req.body;
  try {
    const result = await pool.query(
      "SELECT otp, created_at FROM osp.forgot_pass WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ valid: false, message: "Wrong OTP" });
    }
    const { otp: storedOTP, created_at } = result.rows[0];
    const currentTime = new Date();
    const otpTime = new Date(created_at);
    const timeDifference = currentTime - otpTime;
    // if (timeDifference > 600000) {
    //   // 10 minutes in milliseconds
    //   return res.status(400).json({ valid: false, message: "OTP has expired" });
    // }
    const isMatch = bcrypt.compareSync(otp, storedOTP);
    // console.log(storedOTP);
    // console.log(otp);
    if (isMatch) {
      return res.status(201).json({ valid: true, message: "OTP is valid" });
    } else {
      return res.status(400).json({ valid: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res
      .status(401)
      .json({ valid: false, message: "Internal server error" });
  }
};
const setPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log("reached setPassword");
  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, OTP, and new password are required" });
  }
  try {
    const result = await pool.query(
      "SELECT otp, created_at FROM osp.forgot_pass WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const { otp: storedOTP, created_at } = result.rows[0];
    const currentTime = new Date();
    const otpTime = new Date(created_at);
    const timeDifference = currentTime - otpTime;
    if (timeDifference > 600000) {
      return res.status(400).json({ message: "Request Has been expired" });
    }
    const isMatch = bcrypt.compareSync(otp, storedOTP);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE osp.users SET password = $1 WHERE email = $2", [
      hashedPassword,
      email,
    ]);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error setting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { emailSender, validateOTP, setPassword };
