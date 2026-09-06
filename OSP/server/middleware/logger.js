const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log the body for POST/PUT requests (excluding passwords for security)
  if (['POST', 'PUT'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
    console.log(`Body:`, sanitizedBody);
  }
  
  next();
};

module.exports = requestLogger;