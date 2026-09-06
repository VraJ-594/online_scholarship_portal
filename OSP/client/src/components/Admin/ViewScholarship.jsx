import { getStoredUserInfo } from "../../utils/storage";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContextState, authHeaders } from "../../context/userProvider";
import { ToastContainer, toast, Bounce } from "react-toastify";
import NavbarAdmin from "./AdminNavbar";
import ReactMarkdown from "react-markdown";
import "react-toastify/dist/ReactToastify.css";
import "../../index.css";

// Custom Markdown styling to ensure it looks like a document, not a centered block
const markdownComponents = {
  p: ({ children }) => (
    <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  ul: ({ children }) => <ul className="space-y-3 my-4">{children}</ul>,
  li: ({ children }) => (
    <li className="flex gap-3 text-slate-700">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-slate-900 mb-3 mt-5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-slate-900 mb-2 mt-4">{children}</h3>
  ),
};

const ViewScholarship = () => {
  const navigate = useNavigate();
  const { scholarship_id } = useParams();
  const { baseURL } = useContextState();

  const [scholarshipDetails, setScholarshipDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchScholarship = async () => {
      const userInfo = getStoredUserInfo();

      if (!userInfo?.token) {
        setError("You must be logged in to view scholarship details.");
        setLoading(false);
        return;
      }

      if (!scholarship_id) {
        setError("Invalid scholarship ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${baseURL}/api/scholarship/${scholarship_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch scholarship details.",
          );
        }

        let eligibleCourses = [];
        try {
          if (Array.isArray(data.eligible_courses)) {
            eligibleCourses = data.eligible_courses;
          } else if (data.eligible_courses) {
            eligibleCourses = JSON.parse(data.eligible_courses);
          }
        } catch {
          eligibleCourses = [];
        }

        setScholarshipDetails({
          ...data,
          eligible_courses: eligibleCourses,
        });
      } catch (err) {
        console.error("Error fetching scholarship:", err);
        setError(err.message || "Failed to fetch scholarship details.");
      } finally {
        setLoading(false);
      }
    };

    fetchScholarship();
  }, [baseURL, scholarship_id]);

  const handleEdit = () => {
    if (!scholarshipDetails) return;
    navigate(`/admin/edit-scholarship/${scholarship_id}`, {
      state: {
        scholarship_id,
        scholarshipName: scholarshipDetails.scholarship_name,
        amount: scholarshipDetails.amount,
        endDate: scholarshipDetails.end_date,
        description: scholarshipDetails.description,
        educationLevel: scholarshipDetails.education_level,
        eligibleCourses: scholarshipDetails.eligible_courses,
        minPercentage: scholarshipDetails.min_percentage,
        annualFamilyIncome: scholarshipDetails.annual_family_income,
        benefits: scholarshipDetails.benefits,
        note: scholarshipDetails.note,
      },
    });
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmed = window.confirm(
      "Are you sure you want to completely delete this scholarship?",
    );
    if (!confirmed) return;

    const userInfo = getStoredUserInfo();
    if (!userInfo?.token) {
      toast.error("Authentication expired. Please log in again.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${baseURL}/api/scholarship/deleteScholarship/${scholarship_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete the scholarship.");
      }

      toast.success("Scholarship deleted successfully.");
      setTimeout(() => {
        navigate("/admin");
      }, 1200);
    } catch (err) {
      console.error("Error deleting scholarship:", err);
      toast.error(err.message || "Error deleting the scholarship.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">
          Loading scholarship details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarAdmin />
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              &larr; Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scholarshipDetails) return null;

  return (
    <>
      <NavbarAdmin />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="light"
        transition={Bounce}
      />

      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 sm:px-10 py-10 text-white relative">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                &larr; Back
              </button>

              <p className="text-slate-300 text-sm font-semibold uppercase tracking-wide mb-3 mt-6 sm:mt-2">
                Scholarship Details
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">
                {scholarshipDetails.scholarship_name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 border border-white/10 rounded-xl p-5">
                  <p className="text-slate-300 text-sm font-medium">
                    Scholarship Amount
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{Number(scholarshipDetails.amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-xl p-5">
                  <p className="text-slate-300 text-sm font-medium">
                    Application Deadline
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {new Date(scholarshipDetails.end_date).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-5">
                Overview
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-left">
                <ReactMarkdown components={markdownComponents}>
                  {scholarshipDetails.description || ""}
                </ReactMarkdown>
              </div>
            </section>

            {/* Eligibility Grid */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-5">
                Eligibility Criteria
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="p-6 border-b sm:border-r border-slate-200 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500 mb-2">
                      Education Level
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {scholarshipDetails.education_level || "Not specified"}
                    </p>
                  </div>

                  <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500 mb-2">
                      Minimum Percentage / CPI
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {scholarshipDetails.min_percentage ?? "Not specified"}
                    </p>
                  </div>

                  <div className="p-6 sm:border-r border-slate-200 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500 mb-2">
                      Annual Family Income
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {scholarshipDetails.annual_family_income != null
                        ? `₹${Number(scholarshipDetails.annual_family_income).toLocaleString("en-IN")}`
                        : "Not specified"}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500 mb-3">
                      Eligible Courses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {scholarshipDetails.eligible_courses.length > 0 ? (
                        scholarshipDetails.eligible_courses.map(
                          (course, index) => (
                            <span
                              key={`${course}-${index}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium"
                            >
                              {course}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-slate-400 text-sm">
                          No specific courses listed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-5">
                Benefits
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-left">
                <ReactMarkdown components={markdownComponents}>
                  {scholarshipDetails.benefits || ""}
                </ReactMarkdown>
              </div>
            </section>

            {/* Internal Notes */}
            {scholarshipDetails.note && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-5">
                  Internal Notes
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-left">
                  <ReactMarkdown components={markdownComponents}>
                    {scholarshipDetails.note || ""}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {/* Admin Actions */}
            <div className="pt-4 pb-10 flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={handleEdit}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-8 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Edit Scholarship
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                {isDeleting ? "Deleting..." : "Delete Scholarship"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewScholarship;
