import React, { useState } from "react";
import FileUpload from "./FileUpload";

const CommunicationAddress = ({
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
    if (name === "pin") {
      const numericOnly = value.replace(/\D/g, "").slice(0, 6);
      handleInputChange({
        target: { name, value: numericOnly },
      });
      if (numericOnly.length !== 6 && numericOnly.length > 0) {
        setValidationError("PIN code must be exactly 6 digits.");
        setValidationErrorStatus(true);
      } else {
        setValidationError("");
        setValidationErrorStatus(false);
      }
    } else {
      handleInputChange(e);
    }
  };

  const addressFields = [
    { label: "Village / Area / Locality", name: "village", required: true },
    { label: "Block / Taluka / Sub-district / Town", name: "block", required: true },
    { label: "State", name: "state", required: true },
    { label: "PIN Code", name: "pin", required: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Communication Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {addressFields.map(({ label, name, required }) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <FileUpload
          label="Upload Identity Proof (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "aadharcard")}
          file={pdfFiles.aadharcard}
          clearFile={() => clearPdfFile("aadharcard")}
          cURL={cloudinaryUrls.aadharcard}
          document_name="aadharcard"
          viewFile={viewFile}
        />
        <FileUpload
          label="Upload Income Certificate (PDF)"
          accept="application/pdf"
          onChange={(e) => handlePdfUpload(e, "incomeCertificate")}
          file={pdfFiles.incomeCertificate}
          clearFile={() => clearPdfFile("incomeCertificate")}
          cURL={cloudinaryUrls.incomeCertificate}
          document_name="incomeCertificate"
          viewFile={viewFile}
        />
      </div>
    </div>
  );
};

export default CommunicationAddress;