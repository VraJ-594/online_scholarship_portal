const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const generateToken = require("../config/generateToken");

const authUser = async (req, res) => {
  const { email, password, role } = req.body;

  const userExists = await pool.query(
    `select * from osp.users where email='${email}'`
  );

  if (userExists.rows.length) {
    if (userExists.rows[0].role != role) {
      return res
        .status(401)
        .json({
          success: false,
          message: `You don't have a permission as ${role}`,
        });
    }

    bcrypt.compare(
      password,
      userExists.rows[0].password,
      function (err, response) {
        if (response) {
          // console.log(userExists.rows)
          return res.status(201).json({
            role: userExists.rows[0].role,
            username: userExists.rows[0].username,
            email: userExists.rows[0].email,
            pic: userExists.rows[0].pic,
            token: generateToken({email:userExists.rows[0].email,role:userExists.rows[0].role}),
          });
        } else {
          console.log(err);
          return res
            .status(401)
            .json({ success: false, message: "Invalid Password" });
        }
      }
    );
  } else
    return res
      .status(400)
      .json({ success: false, message: "Login failed User not found" });
};

const authRole = async (req, res) => {
  // console.log(req.body);
  const { email, role } = req.body;

  // console.log(req.body);
  console.log("Reached authRole");

  try {
    const userExists = await pool.query(
      `select * from osp.users where email='${email}'`
    );

    if (userExists.rows.length) {
      // console.log(userExists.rows[0]);

      if (role == userExists.rows[0].role) {
        res.status(201).json({
          username: userExists.rows[0].username,
          email: userExists.rows[0].email,
          pic: userExists.rows[0].pic,
          role: userExists.rows[0].role,
          token: generateToken({email:userExists.rows[0].email , role:userExists.rows[0].role}),
        });

        console.log("Login Successful");
      } else {
        // console.log(role);
        // console.log(userExists.rows[0].role);

        return res
          .status(401)
          .json({
            success: false,
            message: `You don't have a permission as ${role}`,
          });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "User not found Please Login" });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false, message: err });
  }
};
module.exports = { authUser, authRole };
