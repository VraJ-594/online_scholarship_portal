const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
app.use(cookieParser());

// Dynamic CORS configuration based on environment.
// credentials: true is required for the browser to send/accept the
// HttpOnly auth cookie cross-origin (frontend and backend are on different
// domains in production) -- it only works with an exact origin, never "*",
// which is also what keeps a state-changing request's CORS preflight from
// ever succeeding for any origin other than our own frontend.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
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