const express = require("express");

// Controllers
const { registerUser } = require("../controller/registerUser");
const { authUser, authRole } = require("../controller/authUser");
const { googleLogin } = require("../controller/googleAuth");
const { getUserProfile, updateUserProfile } = require("../controller/getUserProfile");
const { getListOfScholarships } = require("../controller/scholarshipListings");
const { handleEmail } = require("../controller/handleEmail");
const { fetchprofile } = require("../controller/fetchprofile");
const { handleProfileData } = require("../controller/profileUpsert");
const { handeluploads } = require("../controller/uploadpdfs");
const { getSecureDocumentUrl } = require("../controller/viewDocument");
const { getListForApplyScholarships } = require("../controller/getListforApplyScholarships");
const { applyForScholarship } = require("../controller/applyForScholarship");
const { getScholarship } = require("../controller/getScholarship");
const { getApplicantId } = require("../controller/getApplicantId");
const { handlePdfUrls } = require("../controller/handlePdfUrls");
const { handleClearPdf } = require("../controller/handleClearPdf");
const { getAppliedScholarships } = require("../controller/getAppliedScholarships");

// Middleware & Config
const upload = require("../config/multer");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

// ──────────────────────────────────────────────────────────────────────
// 1. PUBLIC ROUTES (No authentication required)
// ──────────────────────────────────────────────────────────────────────
router.route("/register").post(registerUser);
router.route("/login").post(authUser);
router.route("/google-login").post(googleLogin);

// authRole re-confirms an existing session's role from the DB -- it
// requires the same valid JWT as every other protected route, not just
// a client-supplied email/role pair (see authRole's own comments).
router.route("/authRole").post(protect, authRole);

// ──────────────────────────────────────────────────────────────────────
// 2. ADMIN ONLY ROUTES (Requires JWT + Admin Role)
// ──────────────────────────────────────────────────────────────────────
router.get("/getuserprofile", protect, requireAdmin, getUserProfile);
router.route("/updateuserprofile").post(protect, requireAdmin, updateUserProfile);

// ──────────────────────────────────────────────────────────────────────
// 3. SECURE DOCUMENT ROUTE (Authorization logic handled in controller)
// ──────────────────────────────────────────────────────────────────────
router.get("/documents/view/:studentEmail/:documentType", protect, getSecureDocumentUrl);

// ──────────────────────────────────────────────────────────────────────
// 4. PROTECTED ROUTES (Requires valid JWT - Student or Admin)
// ──────────────────────────────────────────────────────────────────────
router.get("/getApplicantId", protect, getApplicantId);
router.route("/viewscholarship/:scholarship_id").get(protect, getScholarship);
router.route("/getlistofscholarships").get(protect, getListOfScholarships);
router.route("/getlistforApplyscholarships").get(protect, getListForApplyScholarships);
router.route("/applyForScholarship/:scholarship_id").post(protect, applyForScholarship);
router.route("/getAppliedScholarships").get(protect, getAppliedScholarships);
router.get("/getemail/:email", protect, handleEmail);
router.get("/getprofile/:email", protect, fetchprofile);
router.get("/getpdfurls/:email", protect, handlePdfUrls);
router.post("/profile", protect, handleProfileData);
router.post("/clearpdf/:email/:id", protect, handleClearPdf);
router.post("/pdf/:email/:key", protect, upload.single("file"), handeluploads);

module.exports = router;