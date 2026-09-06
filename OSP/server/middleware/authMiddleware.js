const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Extract the token from the header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token signature and expiration
      const decoded = jwt.verify(token, process.env.token_api);

      // 3. Fetch user from DB securely (Parameterized query)
      // SECURITY: Explicitly EXCLUDE the password column here
      const query = `SELECT id, username, email, role, pic FROM osp.users WHERE email = $1`;
      const result = await pool.query(query, [decoded.email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Not Authorized: User no longer exists" });
      }

      // 4. Attach the safe user object to the request
      req.user = result.rows[0];

      // 5. Move to the next middleware or controller
      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Not Authorized: Token failed or expired" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not Authorized: No token provided" });
  }
};

module.exports = protect;