import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "./Navbar";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useContextState } from "../../context/userProvider";
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

const AdminAddScholarship = () => {
  const navigate = useNavigate();
  const { baseURL } = useContextState();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const [formData, setFormData] = useState({
    scholarship_name: "",
    amount: "",
    end_date: "",
    description: "",
    education_level: "",
    eligible_courses: [],
    min_percentage: "",
    annual_family_income: "",
    benefits: "",
    note: "",
  });

  const [availableCourses, setAvailableCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formData.education_level) {
      setAvailableCourses(
        ELIGIBLE_COURSES_OPTIONS[formData.education_level] || [],
      );
    } else {
      setAvailableCourses([]);
    }
  }, [formData.education_level]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "amount" || name === "annual_family_income") && value < 0) {
      setFormData((prevData) => ({ ...prevData, [name]: 0 }));
      return;
    }

    if (name === "min_percentage") {
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
    if (selectedCourse && !formData.eligible_courses.includes(selectedCourse)) {
      setFormData((prevData) => ({
        ...prevData,
        eligible_courses: [...prevData.eligible_courses, selectedCourse],
      }));
    }
  };

  const removeCourse = (courseToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      eligible_courses: prevData.eligible_courses.filter(
        (course) => course !== courseToRemove,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userInfo || !userInfo.token) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        scholarshipName: formData.scholarship_name,
        amount: formData.amount,
        endDate: formData.end_date,
        description: formData.description,
        educationLevel: formData.education_level,
        eligibleCourses: JSON.stringify(formData.eligible_courses),
        minPercentage: formData.min_percentage,
        annualFamilyIncome: formData.annual_family_income,
        benefits: formData.benefits,
        note: formData.note,
      };

      const response = await fetch(
        `${baseURL}/api/scholarship/addScholarship`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success("Scholarship Added Successfully");
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        toast.error(data.message || "Submission failed");
      }
    } catch (error) {
      toast.error("An error occurred while submitting.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const options = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const istDate = tomorrow.toLocaleString("en-IN", options);
    const [day, month, year] = istDate.split("/");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <NavbarAdmin />
      <ToastContainer
        position="top-right"
        limit={2}
        newestOnTop={true}
        autoClose={3000}
        theme="light"
        transition={Bounce}
      />

      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800">
              Add Scholarship
            </h1>
            <p className="text-slate-500 mt-2">
              Create a new scholarship offering for students.
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
                    name="scholarship_name"
                    value={formData.scholarship_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Merit Cum Means"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    placeholder="e.g. 50000"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-700 font-semibold mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={getTomorrowDate()}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      Education Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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

                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Select Eligible Courses{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      onChange={handleCourseChange}
                      value=""
                      disabled={!formData.education_level}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        {formData.education_level
                          ? "Select a course"
                          : "Select Education Level first"}
                      </option>
                      {availableCourses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {Array.isArray(formData.eligible_courses) &&
                        formData.eligible_courses.map((course) => (
                          <span
                            key={course}
                            className="bg-blue-50 text-blue-700 border border-blue-200 py-1.5 px-3 rounded-md text-sm flex items-center gap-2 font-medium"
                          >
                            {course}
                            <button
                              type="button"
                              className="text-blue-400 hover:text-blue-700 transition-colors focus:outline-none"
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
                      Minimum Percentage (CPI){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="min_percentage"
                      value={formData.min_percentage}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+") e.preventDefault();
                      }}
                      min="0"
                      max="10"
                      step="0.01"
                      required
                      placeholder="e.g. 7.5"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-slate-700 font-semibold mb-2">
                      Annual Family Income Limit (₹){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="annual_family_income"
                      value={formData.annual_family_income}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+") e.preventDefault();
                      }}
                      min="0"
                      required
                      placeholder="e.g. 800000"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    Note (Optional)
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting..." : "Add Scholarship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAddScholarship;
