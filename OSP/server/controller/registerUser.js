
const generateToken = require("../config/generateToken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");


const registerUser = async (req, res) => {


    console.log("Reached registerUser")
  var { username, email, password} = req.body;

  try {

    if (!username || !email || !password) {
      res.status(400).send(JSON.stringify("Please Input all the Feilds"));
      console.error("Please Input all the Feilds");
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
      
        await pool.query(
          "insert into osp.users (username, email, password ,role) values  ($1,$2,$3,$4)",
          [username, email, password,"student"]
        );
      

      const user = await pool.query(
        `select * from osp.users where username='${username}'`
      );
      // console.log(user.rows);
      res.status(201).json({
        id: user.rows[0].id,
        username: user.rows[0].username,
        role :user.rows[0].role,
        email: user.rows[0].email,
        pic: user.rows[0].pic,
        token: generateToken({email:user.rows[0].id , role:user.rows[0].role}),

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
