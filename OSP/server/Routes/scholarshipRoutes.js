const express = require("express");
const { addScholarship } = require("../controller/addScholarship");
const { getScholarships } = require("../controller/getScholarships");
const { deleteScholarship } = require("../controller/deleteScholarship");
const { editScholarship } = require("../controller/editScholarship");
const { getScholarship } = require("../controller/getScholarship");
const {
  getApplicantsByScholarshipId,
} = require("../controller/ApplicantController");
const { getApplicantData } = require("../controller/getApplicantsData");
const { statusUpdate } = require("../controller/statusUpdate");

// Import BOTH middlewares
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

// ADMIN ONLY ROUTES (Requires both middlewares)
router.route("/addScholarship").post(protect, requireAdmin, addScholarship);
router.route("/editScholarship/:scholarship_id").put(protect, requireAdmin, editScholarship);
router.route("/deleteScholarship/:scholarship_id").delete(protect, requireAdmin, deleteScholarship);

// ADMIN ONLY DATA VIEWING
router.route("/getApplicantData").get(protect, requireAdmin, getApplicantData);
router.route("/statusUpdate").put(protect, requireAdmin, statusUpdate);
router.route("/:id/applicants").get(protect, requireAdmin, getApplicantsByScholarshipId);

// SHARED ROUTES (Only requires login, accessible by both Admin and Student)
router.route("/getScholarships").get(protect, getScholarships);
router.route("/:scholarship_id").get(protect, getScholarship);

module.exports = router;