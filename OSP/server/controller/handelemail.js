const pool = require("../config/db");

const handelemail = async (req, res) => {
  const email = req.params.email;

  console.log(email);

  console.log(email);
  console.log(email);

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

module.exports = { handelemail };
