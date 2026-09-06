const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./Routes/userRoutes");
const scholarshipRoutes = require("./Routes/scholarshipRoutes");
const resetPassRoute = require("./Routes/resetPassRoutes");

// Import our new middleware
const requestLogger = require("./middleware/logger");
const errorHandler = require("./middleware/errorMiddleware");

dotenv.config();
const port = process.env.PORT || 8080;

app.use(express.json());

// Dynamic CORS configuration based on environment
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// 1. LOGGER: Runs first to catch every incoming request
app.use(requestLogger);

// 2. ROUTERS
app.use("/api/user", userRoutes);
app.use("/api/scholarship", scholarshipRoutes);
app.use("/api/passwordreset", resetPassRoute);

// 3. ERROR HANDLER: Runs last to catch any crashes from the controllers
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});