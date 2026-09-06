
const generateToken = require("../config/generateToken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");


const registerUser = async (req, res) => {


    console.log("Reached registerUser")
  var { username, email, password} = req.body;

  try {

    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: "Please input all the fields" });
      console.error("Please input all the fields");
      return;
    }

    const userExist = await pool.query(
      "select * from osp.users where email=($1)",
      [email]
    );

    if (userExist.rows.length) {
      res.status(400).send({
        success: false,
        message: `User already exists`,
      });
      console.error("User already exists");
      return;
    }

    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    try {

      const inserted = await pool.query(
        "insert into osp.users (username, email, password ,role) values ($1,$2,$3,$4) returning id, username, role, email, pic",
        [username, email, password, "student"]
      );
      const user = inserted.rows[0];

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        pic: user.pic,
        token: generateToken({ email: user.email, role: user.role }),
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        errMsg: "Something went wrong while creating your account",
      });
    }

} catch (err) {
    console.log(err);
    res.status(400).json({
        errMsg : "Something went wrong"
    })
  }
};

module.exports = { registerUser };
