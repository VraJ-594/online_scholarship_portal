const pool = require("../config/db");

const getUserProfile = async (req, res) => {
  console.log('Reached User Profile');
  const email = req.query.email; // email is passed as a query parameter
  console.log(email);
  try {
    // Select only the email and username columns where role is "admin"
    const userQuery = 'SELECT email, username FROM osp.users WHERE email = $1 AND role = $2';
    const userResult = await pool.query(userQuery, [email, "admin"]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    res.status(200).json(userResult.rows[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUserProfile = async (req, res) => {
  const { email, name } = req.body; // Only accept email and name from the request body
  console.log('Reached Update User Profile');
  try {
    // Validate input
    if (!email || !name) {
      return res.status(400).json({ error: "Email and Name are required" });
    }

    
    const updateQuery = `UPDATE osp.users SET username = $1 WHERE email = $2`;
    const updateResult = await pool.query(updateQuery, [name, email]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.status(200).json({ message: "Username updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getUserProfile,updateUserProfile };