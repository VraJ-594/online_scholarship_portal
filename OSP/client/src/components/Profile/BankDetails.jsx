import React, { useState } from "react";
import FileUpload from "./FileUpload";

const BankDetails = ({
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

  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "bankAccount") {
      const numericOnly = value.replace(/\D/g, "").slice(0, 18);
      handleInputChange({ target: { name, value: numericOnly } });
      if (numericOnly.length < 9 && numericOnly.length > 0) {
        setValidationError("Bank Account Number must be at least 9 digits.");
        setValidationErrorStatus(true);
      } else {
        setValidationError("");
        setValidationErrorStatus(false);
      }
    } else if (name === "ifscCode") {
      const formatted = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
      handleInputChange({ target: { name, value: formatted } });
      if (formatted.length !== 11 && formatted.length > 0) {
        setValidationError("IFSC code must be exactly 11 characters.");
        setValidationErrorStatus(true);
      } else {
        setValidationError("");
        setValidationErrorStatus(false);
      }
    } else if (["bankName", "bankBranch"].includes(name)) {
      const alphabetsOnly = value.replace(/[^a-zA-Z\s]/g, "");
      handleInputChange({ target: { name, value: alphabetsOnly } });
    } else {
      handleInputChange(e);
    }
  };

  const bankFields = [
    { label: "Savings Bank Account Number", name: "bankAccount", required: true },
    { label: "IFSC Code", name: "ifscCode", required: true },
    { label: "Bank Name", name: "bankName", required: true },
    { label: "Bank Branch", name: "bankBranch", required: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Bank Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {bankFields.map(({ label, name, required }) => (
          <div key={name} className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name={name}
              value={formData[name] || ""}
              onChange={handleValidatedInputChange}
              required={required}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
            />
          </div>
        ))}
      </div>

      {validationError && (
        <p className="text-red-500 text-sm font-medium mb-4">{validationError}</p>
      )}

      <div className="pt-4 border-t border-slate-100">
        <FileUpload
          label="Upload Bank Passbook / Cancelled Cheque (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "bankPassbook")}
          file={pdfFiles.bankPassbook}
          clearFile={() => clearPdfFile("bankPassbook")}
          cURL={cloudinaryUrls.bankPassbook}
          document_name="bankPassbook"
          viewFile={viewFile}
        />
      </div>
    </div>
  );
};

export default BankDetails;