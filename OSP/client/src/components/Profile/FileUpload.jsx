import React from "react";
import { FaFilePdf, FaExternalLinkAlt, FaTimes } from "react-icons/fa";

const FileUpload = ({
  label,
  accept = "application/pdf",
  onChange,
  file,
  clearFile,
  cURL,
  document_name,
  viewFile,
}) => {
  const inputId = `file-upload-${document_name || label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="w-full flex flex-col space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg cursor-pointer border border-slate-300 transition-colors"
        >
          <FaFilePdf className="text-red-500 text-base" />
          <span>
            {file ? file.name : cURL ? "Replace File" : "Choose PDF Document"}
          </span>
        </label>
        
        <input
          type="file"
          id={inputId}
          accept={accept}
          onChange={onChange}
          className="hidden"
        />

        {cURL && (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => viewFile(cURL)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-semibold rounded-lg border border-blue-200 transition-colors"
            >
              <FaExternalLinkAlt className="text-xs" />
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={clearFile}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              title="Remove File"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        )}
      </div>
      {(file || cURL) && (
        <span className="text-xs text-slate-500 font-medium">
          {file ? `Selected: ${file.name}` : "File uploaded to cloud"}
        </span>
      )}
    </div>
  );
};

export default FileUpload;