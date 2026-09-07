import React, { useState } from "react";
import FileUpload from "./FileUpload";
// Import our single source of truth (Adjust path based on your folder structure)
import {
  EDUCATION_LEVELS,
  ELIGIBLE_COURSES_OPTIONS,
} from "../../constants/academicData";

const CurrentAcademicDetails = ({
  formData,
  handleInputChange,
  pdfFiles,
  handlePdfUpload,
  clearPdfFile,
  cloudinaryUrls,
  viewFile,
  setValidationErrorStatus,
}) => {
  const [validationError, setValidationError] = useState("");

  // Dynamically get available courses based on selected level
  const availableCourses = formData.courseLevel
    ? ELIGIBLE_COURSES_OPTIONS[formData.courseLevel] || []
    : [];

  const calculateTotalFees = () => {
    const tuitionFees = parseFloat(formData.tuitionFees) || 0;
    const nonTuitionFees = parseFloat(formData.nonTuitionFees) || 0;
    return tuitionFees + nonTuitionFees;
  };

  const handleValidatedInputChange = (e) => {
    const { value } = e.target;
    if (parseFloat(value) < 0) {
      setValidationError("Negative fee values are not allowed.");
      setValidationErrorStatus(true);
      return;
    } else {
      setValidationError("");
      setValidationErrorStatus(false);
    }
    handleInputChange(e);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">
        Current Academic Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Course Level Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Education Level <span className="text-red-500">*</span>
          </label>
          <select
            name="courseLevel"
            value={formData.courseLevel || ""}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          >
            <option value="" disabled>
              Select Education Level
            </option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Course Name Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Course Name <span className="text-red-500">*</span>
          </label>
          <select
            name="courseName"
            value={formData.courseName || ""}
            onChange={handleInputChange}
            disabled={!formData.courseLevel}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {formData.courseLevel
                ? "Select Course Name"
                : "Select Education Level first"}
            </option>
            {availableCourses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Tuition Fees (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="tuitionFees"
            value={formData.tuitionFees || ""}
            onChange={handleValidatedInputChange}
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Non-Tuition Fees (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="nonTuitionFees"
            value={formData.nonTuitionFees || ""}
            onChange={handleValidatedInputChange}
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Total Current Fees (₹)
          </label>
          <input
            type="number"
            value={calculateTotalFees()}
            readOnly
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
      </div>

      {validationError && (
        <p className="text-red-500 text-sm font-medium mb-4">
          {validationError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <FileUpload
          label="Tuition Fee Receipt / Fee Structure (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "tuitionFeeReceipt")}
          file={pdfFiles.tuitionFeeReceipt}
          clearFile={() => clearPdfFile("tuitionFeeReceipt")}
          cURL={cloudinaryUrls.tuitionFeeReceipt}
          document_name="tuitionFeeReceipt"
          viewFile={viewFile}
        />
        <FileUpload
          label="Non-Tuition Fee Receipt (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "nonTuitionFeeReceipt")}
          file={pdfFiles.nonTuitionFeeReceipt}
          clearFile={() => clearPdfFile("nonTuitionFeeReceipt")}
          cURL={cloudinaryUrls.nonTuitionFeeReceipt}
          document_name="nonTuitionFeeReceipt"
          viewFile={viewFile}
        />
      </div>
    </div>
  );
};

export default CurrentAcademicDetails;
