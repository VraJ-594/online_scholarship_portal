const errorHandler = (err, req, res, next) => {
  console.error(`\n❌ [ERROR] ${req.method} ${req.url}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack Trace:\n${err.stack}\n`);

  // Send a safe JSON response back to React so it doesn't hang
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    // Only send the stack trace if we are in development mode!
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

module.exports = errorHandler;