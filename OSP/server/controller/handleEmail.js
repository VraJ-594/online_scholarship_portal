const pool = require("../config/db");

const handleEmail = async (req, res) => {
  const email = req.params.email;

  if (req.user.role !== "admin" && req.user.email !== email) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to check this email." });
  }

  try {
    const query = "SELECT osp.applicants.email FROM osp.applicants WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length > 0) {
      console.log("send found");
      res.status(200).send("Email found");
    } else {
      console.log("send not found");
      res.status(404).send("Email not found");
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).send("Server error");
  }
};

module.exports = { handleEmail };
