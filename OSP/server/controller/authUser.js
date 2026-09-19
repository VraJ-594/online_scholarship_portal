const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const generateToken = require("../config/generateToken");
const { setAuthCookie, clearAuthCookie } = require("../config/authCookie");

const authUser = async (req, res) => {
  const { email, password, role } = req.body;

  const userExists = await pool.query(
    "select * from osp.users where email=($1)",
    [email]
  );

  if (!userExists.rows.length) {
    return res
      .status(400)
      .json({ success: false, message: "Login failed User not found" });
  }

  // Check the password before revealing anything about the account's role,
  // so a wrong-role login attempt can't be used to fingerprint which role
  // an email is registered under.
  bcrypt.compare(
    password,
    userExists.rows[0].password,
    function (err, response) {
      if (!response) {
        console.log(err);
        return res
          .status(401)
          .json({ success: false, message: "Invalid Password" });
      }

      if (userExists.rows[0].role != role) {
        return res
          .status(401)
          .json({
            success: false,
            message: `You don't have a permission as ${role}`,
          });
      }

      setAuthCookie(
        res,
        generateToken({ email: userExists.rows[0].email, role: userExists.rows[0].role }),
      );
      return res.status(201).json({
        role: userExists.rows[0].role,
        username: userExists.rows[0].username,
        email: userExists.rows[0].email,
        pic: userExists.rows[0].pic,
      });
    }
  );
};

// Re-confirms an existing session and hands back a fresh token. Identity
// and role come ONLY from req.user, which the `protect` middleware already
// populated from a verified JWT + a fresh DB lookup -- never from the
// request body. (Previously this trusted a client-supplied {email, role}
// pair with no JWT check at all: anyone who knew an admin's email could
// POST {email, role:"admin"} here and receive a valid admin token with no
// password. The route now requires `protect`, closing that off entirely.)
const authRole = async (req, res) => {
  setAuthCookie(res, generateToken({ email: req.user.email, role: req.user.role }));
  return res.status(200).json({
    username: req.user.username,
    email: req.user.email,
    pic: req.user.pic,
    role: req.user.role,
  });
};

// Clears the session cookie. Public: logging out is safe to call regardless
// of whether the caller is actually authenticated.
const logoutUser = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out" });
};

module.exports = { authUser, authRole, logoutUser };
