const requireAdmin = (req, res, next) => {
  // Check if the user exists and has the 'admin' role
  if (req.user && req.user.role === "admin") {
    next(); // Authorized, proceed to the controller
  } else {
    // 403 Forbidden means "I know who you are, but you aren't allowed here."
    res.status(403).json({ message: "Forbidden: Admin privileges required." });
  }
};

module.exports = requireAdmin;