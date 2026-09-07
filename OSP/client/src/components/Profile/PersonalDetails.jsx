import React from "react";

const PersonalDetails = ({ formData, handleInputChange }) => {
  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    const alphabetsOnlyFields = [
      "firstname",
      "middlename",
      "lastname",
      "category",
      "parentName",
      "occupation",
    ];
    const numericOnlyFields = ["mobileNumber", "parentMobile", "incomelimit"];

    if (alphabetsOnlyFields.includes(name)) {
      const alphabetsOnly = value.replace(/[^a-zA-Z\s]/g, "");
      handleInputChange({ target: { name, value: alphabetsOnly } });
    } else if (numericOnlyFields.includes(name)) {
      const numericOnly = value.replace(/\D/g, "");
      if (["mobileNumber", "parentMobile"].includes(name)) {
        handleInputChange({
          target: { name, value: numericOnly.slice(0, 10) },
        });
      } else {
        handleInputChange({ target: { name, value: numericOnly } });
      }
    } else {
      handleInputChange(e);
    }
  };

  const fields = [
    { label: "First Name", name: "firstname", required: true },
    { label: "Middle Name", name: "middlename", required: true },
    { label: "Last Name", name: "lastname", required: true },
    { label: "Date of Birth", name: "dob", type: "date", required: true },
    {
      label: "Gender",
      name: "gender",
      type: "select",
      options: ["Male", "Female", "Other"],
      required: true,
    },
    { label: "Category", name: "category", required: true },
    { label: "Mobile Number", name: "mobileNumber", required: true },
    { label: "Parent's Full Name", name: "parentName", required: true },
    { label: "Occupation", name: "occupation" },
    { label: "Parent's Mobile No", name: "parentMobile" },
    { label: "Income Limit (Annual ₹)", name: "incomelimit", required: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Personal Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(({ label, name, type = "text", options, required }) => (
          <div key={name} className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === "select" ? (
              <select
                name={name}
                value={formData[name] || ""}
                onChange={handleInputChange}
                required={required}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select {label}</option>
                {options.map((option) => (
                  <option key={option} value={option.toLowerCase()}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                name={name}
                value={formData[name] || ""}
                onChange={handleValidatedInputChange}
                required={required}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            )}
          </div>
        ))}
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-semibold text-slate-700 mb-2">Registered Email</label>
          <input
            type="text"
            value={formData.email || ""}
            readOnly
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;