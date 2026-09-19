const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { COOKIE_NAME } = require("../config/authCookie");

const protect = async (req, res, next) => {
  // The token lives in an HttpOnly cookie now, never in a header the
  // frontend could read or attach itself -- see OSP_OAuth_Implementation.md.
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Not Authorized: No token provided" });
  }

  try {
    // 1. Verify the token signature and expiration
    const decoded = jwt.verify(token, process.env.token_api);

    // 2. Fetch user from DB securely (Parameterized query)
    // SECURITY: Explicitly EXCLUDE the password column here
    const query = `SELECT id, username, email, role, pic FROM osp.users WHERE email = $1`;
    const result = await pool.query(query, [decoded.email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Not Authorized: User no longer exists" });
    }

    // 3. Attach the safe user object to the request
    req.user = result.rows[0];

    // 4. Move to the next middleware or controller
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Not Authorized: Token failed or expired" });
  }
};

module.exports = protect;