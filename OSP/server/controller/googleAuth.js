const pool = require("../config/db");
const generateToken = require("../config/generateToken");
const { verifyGoogleIdToken } = require("../config/googleClient");

const ALLOWED_DOMAIN = "dau.ac.in";

const googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Missing Google credential." });
  }

  let payload;
  try {
    payload = await verifyGoogleIdToken(credential);
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid Google sign-in, please try again." });
  }

  const email = (payload.email || "").toLowerCase();
  const isAllowedDomain =
    payload.email_verified === true &&
    payload.hd === ALLOWED_DOMAIN &&
    email.endsWith(`@${ALLOWED_DOMAIN}`);

  if (!isAllowedDomain) {
    return res.status(403).json({
      message: `Please sign in with your official @${ALLOWED_DOMAIN} Google account.`,
    });
  }

  try {
    const existing = await pool.query("SELECT * FROM osp.users WHERE email = $1", [email]);

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.role !== "student") {
        return res.status(403).json({
          message: "This account uses password login. Please sign in with your password.",
        });
      }
    } else {
      const username = payload.name || email.split("@")[0];
      const inserted = await pool.query(
        `INSERT INTO osp.users (username, email, password, role, pic)
         VALUES ($1, $2, NULL, 'student', $3)
         RETURNING id, username, email, role, pic`,
        [username, email, payload.picture || null]
      );
      user = inserted.rows[0];
    }

    return res.status(200).json({
      role: user.role,
      username: user.username,
      email: user.email,
      pic: user.pic,
      token: generateToken({ email: user.email, role: user.role }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { googleLogin };
