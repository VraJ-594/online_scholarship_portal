import React, { useState } from "react";
import FileUpload from "./FileUpload";

const Class10Details = ({
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

  const calculatePercentage = (marksObtained, totalMarks) => {
    if (marksObtained && totalMarks && parseFloat(totalMarks) > 0) {
      return ((parseFloat(marksObtained) / parseFloat(totalMarks)) * 100).toFixed(2);
    }
    return "";
  };

  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    handleInputChange(e);

    if (parseFloat(value) < 0) {
      setValidationError("Negative marks are not allowed.");
      setValidationErrorStatus(true);
      return;
    }

    const marksObtained = name === "class10MarksObtained" ? value : formData.class10MarksObtained;
    const totalMarks = name === "class10TotalMarks" ? value : formData.class10TotalMarks;

    if (marksObtained && totalMarks && parseFloat(marksObtained) > parseFloat(totalMarks)) {
      setValidationError("Marks obtained cannot exceed total marks.");
      setValidationErrorStatus(true);
    } else {
      setValidationError("");
      setValidationErrorStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Class 10 Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Name of Institute <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="class10Institute"
            value={formData.class10Institute || ""}
            onChange={handleInputChange}
            required
            placeholder="Enter school name"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Month & Year of Passing <span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            name="class10PassingDate"
            value={formData.class10PassingDate || ""}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Marks Obtained <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="class10MarksObtained"
            value={formData.class10MarksObtained || ""}
            onChange={handleValidatedInputChange}
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 mb-2">
            Out of Total Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="class10TotalMarks"
            value={formData.class10TotalMarks || ""}
            onChange={handleValidatedInputChange}
            required
            min="1"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 mb-2">Percentage (%)</label>
          <input
            type="text"
            value={calculatePercentage(formData.class10MarksObtained, formData.class10TotalMarks)}
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
          label="Upload Class 10 Marksheet (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "class10MarkSheet")}
          file={pdfFiles.class10MarkSheet}
          clearFile={() => clearPdfFile("class10MarkSheet")}
          cURL={cloudinaryUrls.class10MarkSheet}
          document_name="class10MarkSheet"
          viewFile={viewFile}
        />
      </div>
    </div>
  );
};

export default Class10Details;