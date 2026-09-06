import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useContextState, authHeaders } from "../../context/userProvider";
import NavbarStudent from "../Navbar/Navbar";
import { ToastContainer, toast, Bounce } from "react-toastify";
import ReactMarkdown from "react-markdown";
import "react-toastify/dist/ReactToastify.css";
import "../../index.css";

// Custom Markdown styling for structured, left-aligned reading
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

const ViewScholarshipStudent = () => {
  const navigate = useNavigate();
  const { scholarship_id } = useParams();
  const { baseURL } = useContextState();

  const [scholarshipDetails, setScholarshipDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const loadPageData = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

      if (!userInfo?.token || !userInfo?.email) {
        setError("You must be logged in to view this scholarship.");
        setLoading(false);
        return;
      }

      if (!scholarship_id) {
        setError("Invalid scholarship ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const scholarshipResponse = await fetch(
          `${baseURL}/api/user/viewscholarship/${scholarship_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          },
        );

        const scholarshipData = await scholarshipResponse
          .json()
          .catch(() => ({}));
        if (!scholarshipResponse.ok) {
          throw new Error(
            scholarshipData.message || "Failed to fetch scholarship details.",
          );
        }

        let eligibleCourses = [];
        try {
          if (Array.isArray(scholarshipData.eligible_courses)) {
            eligibleCourses = scholarshipData.eligible_courses;
          } else if (scholarshipData.eligible_courses) {
            eligibleCourses = JSON.parse(scholarshipData.eligible_courses);
          }
        } catch {
          eligibleCourses = [];
        }

        setScholarshipDetails({
          ...scholarshipData,
          eligible_courses: eligibleCourses,
        });

        const emailResponse = await fetch(
          `${baseURL}/api/user/getemail/${encodeURIComponent(userInfo.email)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          },
        );

        if (!emailResponse.ok) {
          setIsProfileComplete(false);
          return;
        }

        const documentsResponse = await fetch(
          `${baseURL}/api/user/getpdfurls/${encodeURIComponent(userInfo.email)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          },
        );

        if (!documentsResponse.ok) {
          setIsProfileComplete(false);
          return;
        }

        const documents = await documentsResponse.json().catch(() => ({}));
        const requiredDocuments = [
          "incomeCertificate",
          "bankPassbook",
          "aadharcard",
          "tuitionFeeReceipt",
          "nonTuitionFeeReceipt",
          "class10MarkSheet",
          "class12MarkSheet",
          "currentEducationMarkSheet",
        ];

        const complete = requiredDocuments.every((document) =>
          Boolean(documents[document]),
        );
        setIsProfileComplete(complete);
      } catch (err) {
        console.error("Error loading scholarship page:", err);
        setError(err.message || "Failed to load scholarship information.");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [baseURL, scholarship_id]);

  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleApply = async () => {
    if (!isProfileComplete) {
      toast.error(
        "Please complete your profile and upload all documents before applying.",
      );
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (!userInfo?.token || !userInfo?.email) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    setIsApplying(true);
    try {
      const applicantResponse = await fetch(
        `${baseURL}/api/user/getApplicantId`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            email: userInfo.email,
          },
        },
      );

      const applicantData = await applicantResponse.json().catch(() => ({}));
      if (!applicantResponse.ok) {
        throw new Error(
          applicantData.message || "Failed to fetch applicant ID.",
        );
      }

      const applicantId = applicantData?.applicant?.applicant_id;
      if (!applicantId) {
        throw new Error("Applicant ID was not found.");
      }

      const payload = {
        scholarship_id,
        applied_date: getTodayDate(),
        applicant_id: applicantId,
        status: "Pending",
      };

      const response = await fetch(
        `${baseURL}/api/user/applyForScholarship/${scholarship_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409) {
          toast.warning(
            responseData.message ||
              "You have already applied for this scholarship.",
          );
          return;
        }
        throw new Error(
          responseData.message || "Failed to apply for scholarship.",
        );
      }

      toast.success("Successfully applied for the scholarship!");
      setTimeout(() => {
        navigate("/student/scholarship");
      }, 1200);
    } catch (err) {
      console.error("Error applying for scholarship:", err);
      toast.error(err.message || "Error applying for the scholarship.");
    } finally {
      setIsApplying(false);
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
        <NavbarStudent />
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
      <NavbarStudent />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        transition={Bounce}
      />

      {/* Main Content Area */}
      <div className="min-h-screen bg-slate-50 pt-10 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 sm:px-10 py-10 text-white relative">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 text-blue-200 hover:text-white text-sm font-medium transition-colors"
              >
                &larr; Back
              </button>

              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-3 mt-6 sm:mt-2">
                Scholarship Opportunity
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8">
                {scholarshipDetails.scholarship_name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 border border-white/10 rounded-xl p-5">
                  <p className="text-blue-100 text-sm font-medium">
                    Scholarship Amount
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{Number(scholarshipDetails.amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-xl p-5">
                  <p className="text-blue-100 text-sm font-medium">
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

            {/* Additional Notes */}
            {scholarshipDetails.note && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-5">
                  Additional Information
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-left">
                  <ReactMarkdown components={markdownComponents}>
                    {scholarshipDetails.note || ""}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {!isProfileComplete && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-6 text-center font-medium">
                Please complete your profile and upload all required documents
                before applying.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Apply Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block text-left">
            <p className="text-sm text-slate-500 font-medium">
              Ready to take the next step?
            </p>
            <p className="font-bold text-slate-900 text-lg">
              Submit your scholarship application
            </p>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || !isProfileComplete}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-10 py-3.5 rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {isApplying ? "Applying..." : "Apply Now"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewScholarshipStudent;
