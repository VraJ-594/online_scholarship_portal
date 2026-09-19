const COOKIE_NAME = "osp_token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // must match generateToken's expiresIn

// Frontend (Vercel) and backend (Render) are different origins in production,
// so the cookie needs SameSite=None + Secure to be sent at all. Locally
// they're both http://localhost, where Secure cookies get silently dropped
// and SameSite=None requires Secure -- so dev needs Lax + non-Secure instead.
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: COOKIE_MAX_AGE_MS,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
};

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
