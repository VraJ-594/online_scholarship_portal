import React, { useState } from "react";
import FileUpload from "./FileUpload";

const CurrentEducationDetails = ({
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

  const calculateCgpaPercentage = (cgpaObtained, cgpaTotal) => {
    if (cgpaObtained && cgpaTotal && parseFloat(cgpaTotal) > 0) {
      return ((parseFloat(cgpaObtained) / parseFloat(cgpaTotal)) * 100).toFixed(2);
    }
    return "";
  };

  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    handleInputChange(e);

    if (parseFloat(value) < 0) {
      setValidationError("Negative CGPA values are not allowed.");
      setValidationErrorStatus(true);
      return;
    }

    if (parseFloat(value) > 10) {
      setValidationError("CGPA cannot be greater than 10.");
      setValidationErrorStatus(true);
      return;
    }

    if (name === "currentCgpaTotal" && value !== "" && parseFloat(value) < 1) {
      setValidationError("Total CGPA scale must be at least 1.");
      setValidationErrorStatus(true);
      return;
    }

    const cgpaObtained = name === "currentCgpaObtained" ? value : formData.currentCgpaObtained;
    const cgpaTotal = name === "currentCgpaTotal" ? value : formData.currentCgpaTotal;

    if (cgpaObtained && cgpaTotal && parseFloat(cgpaObtained) > parseFloat(cgpaTotal)) {
      setValidationError("Obtained CGPA cannot exceed Total CGPA.");
      setValidationErrorStatus(true);
    } else {
      setValidationError("");
      setValidationErrorStatus(false);
    }
  };

  const batchOptions = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Current Education Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Education Batch <span className="text-red-500">*</span>
          </label>
          <select
            name="currentEducationBatch"
            value={formData.currentEducationBatch || ""}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          >
            <option value="">Select Batch</option>
            {batchOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Current Semester <span className="text-red-500">*</span>
          </label>
          <select
            name="currentSemester"
            value={formData.currentSemester || ""}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          >
            <option value="">Select Semester</option>
            {semesterOptions.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            CGPA Obtained <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            name="currentCgpaObtained"
            value={formData.currentCgpaObtained || ""}
            onChange={handleValidatedInputChange}
            required
            min="0"
            max="10"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Total CGPA Scale <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            name="currentCgpaTotal"
            value={formData.currentCgpaTotal || ""}
            onChange={handleValidatedInputChange}
            required
            min="1"
            max="10"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 mb-2">Equated Percentage (%)</label>
          <input
            type="text"
            value={calculateCgpaPercentage(formData.currentCgpaObtained, formData.currentCgpaTotal)}
            readOnly
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
          />
        </div>
      </div>

      {validationError && (
        <p className="text-red-500 text-sm font-medium mb-4">{validationError}</p>
      )}

      <div className="pt-4 border-t border-slate-100">
        <FileUpload
          label="Upload Current Education Marksheet (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "currentEducationMarkSheet")}
          file={pdfFiles.currentEducationMarkSheet}
          clearFile={() => clearPdfFile("currentEducationMarkSheet")}
          cURL={cloudinaryUrls.currentEducationMarkSheet}
          document_name="currentEducationMarkSheet"
          viewFile={viewFile}
        />
      </div>
    </div>
  );
};

export default CurrentEducationDetails;