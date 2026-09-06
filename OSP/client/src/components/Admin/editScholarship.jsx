import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContextState } from "../../context/userProvider";
import NavbarAdmin from "./Navbar";
import { ToastContainer, toast, Bounce } from "react-toastify";
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "../../index.css";

// Import our single source of truth
import {
  EDUCATION_LEVELS,
  ELIGIBLE_COURSES_OPTIONS,
} from "../../constants/academicData";

const mdeOptions = {
  spellChecker: false,
  status: false,
  toolbar: [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "unordered-list",
    "ordered-list",
    "|",
    "link",
    "preview",
  ],
};

const AdminEditScholarship = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { baseURL } = useContextState();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    scholarshipName: state?.scholarshipName || "",
    amount: state?.amount || "",
    endDate: state?.endDate ? formatDate(state.endDate) : "",
    description: state?.description || "",
    educationLevel: state?.educationLevel || "",
    eligibleCourses: Array.isArray(state?.eligibleCourses)
      ? state.eligibleCourses
      : [],
    minPercentage: state?.minPercentage || "",
    annualFamilyIncome: state?.annualFamilyIncome || "",
    benefits: state?.benefits || "",
    note: state?.note || "",
    scholarship_id: state?.scholarship_id || "",
  });

  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    if (formData.educationLevel) {
      setAvailableCourses(
        ELIGIBLE_COURSES_OPTIONS[formData.educationLevel] || [],
      );
    } else {
      setAvailableCourses([]);
    }
  }, [formData.educationLevel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === "amount" || name === "annualFamilyIncome") && value < 0)
      return;

    if (name === "minPercentage") {
      const numericValue = parseFloat(value);
      if (
        numericValue < 0 ||
        numericValue > 10 ||
        !/^\d*(\.\d{0,2})?$/.test(value)
      ) {
        return;
      }
    }
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleDescriptionChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  }, []);

  const handleBenefitsChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, benefits: value }));
  }, []);

  const handleNoteChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, note: value }));
  }, []);

  const handleCourseChange = (event) => {
    const selectedCourse = event.target.value;
    if (selectedCourse && !formData.eligibleCourses.includes(selectedCourse)) {
      setFormData((prevData) => ({
        ...prevData,
        eligibleCourses: [...prevData.eligibleCourses, selectedCourse],
      }));
    }
  };

  const removeCourse = (courseToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      eligibleCourses: prevData.eligibleCourses.filter(
        (c) => c !== courseToRemove,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save these changes?")) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        eligibleCourses: JSON.stringify(formData.eligibleCourses),
      };

      const response = await fetch(
        `${baseURL}/api/scholarship/editScholarship/${formData.scholarship_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success("Scholarship Updated Successfully");
        setTimeout(() => {
          navigate(`/admin/viewscholarship/${formData.scholarship_id}`);
        }, 1500);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error("A network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <>
      <NavbarAdmin />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="light"
        transition={Bounce}
      />

      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center relative">
            <button
              onClick={() => navigate(-1)}
              className="absolute top-0 left-0 text-blue-600 hover:underline text-sm font-medium"
            >
              &larr; Cancel
            </button>
            <h1 className="text-3xl font-bold text-slate-800">
              Edit Scholarship
            </h1>
            <p className="text-slate-500 mt-2">
              Modify the details of this program.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    Scholarship Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="scholarshipName"
                    value={formData.scholarshipName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "+") e.preventDefault();
                    }}
                    min="0"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={getTomorrowDate()}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="markdown-editor-container border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <SimpleMdeReact
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      options={mdeOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-6">
                  Eligibility Criteria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Education Level
                    </label>
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="" disabled>
                        Select Level
                      </option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Eligible Courses
                    </label>
                    <select
                      onChange={handleCourseChange}
                      value=""
                      disabled={!formData.educationLevel}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-slate-100"
                    >
                      <option value="" disabled>
                        {formData.educationLevel
                          ? "Select a course"
                          : "Select Level first"}
                      </option>
                      {availableCourses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.eligibleCourses.map((course) => (
                        <span
                          key={course}
                          className="bg-blue-50 text-blue-700 border border-blue-200 py-1.5 px-3 rounded-md text-sm flex items-center gap-2 font-medium"
                        >
                          {course}
                          <button
                            type="button"
                            className="text-blue-400 hover:text-blue-700"
                            onClick={() => removeCourse(course)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Minimum Percentage (CPI)
                    </label>
                    <input
                      type="number"
                      name="minPercentage"
                      value={formData.minPercentage}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+") e.preventDefault();
                      }}
                      min="0"
                      max="10"
                      step="0.01"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Annual Family Income Limit
                    </label>
                    <input
                      type="number"
                      name="annualFamilyIncome"
                      value={formData.annualFamilyIncome}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+") e.preventDefault();
                      }}
                      min="0"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-8 space-y-6">
                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    Benefits
                  </label>
                  <div className="markdown-editor-container border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <SimpleMdeReact
                      value={formData.benefits}
                      onChange={handleBenefitsChange}
                      options={mdeOptions}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    Internal Note
                  </label>
                  <div className="markdown-editor-container border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <SimpleMdeReact
                      value={formData.note}
                      onChange={handleNoteChange}
                      options={mdeOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminEditScholarship;
