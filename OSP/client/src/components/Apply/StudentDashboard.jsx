import { getStoredUserInfo } from "../../utils/storage";
import React, { useEffect, useState } from "react";
import { useContextState, authHeaders } from "../../context/userProvider";
import { FaBoxOpen, FaExclamationCircle, FaSpinner } from "react-icons/fa";
import "../../index.css";

const ScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { baseURL } = useContextState();

  useEffect(() => {
    const fetchAppliedScholarships = async () => {
      setLoading(true);
      setError(null);

      const userInfo = getStoredUserInfo();

      // Safety check: ensure user is logged in AND has a token
      if (!userInfo || !userInfo.email || !userInfo.token) {
        setError("User session not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${baseURL}/api/user/getAppliedScholarships`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              email: userInfo.email, // Kept to preserve original backend contract
              ...authHeaders(), // INJECTED JWT TOKEN HERE!
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch your applications.");
        }

        const data = await response.json();

        // Defensive check to ensure data is an array before mapping
        if (Array.isArray(data)) {
          setScholarships(data);
        } else {
          setScholarships([]);
        }
      } catch (err) {
        // console.error("Error fetching applicants:", err);
        setError("Could not load scholarships. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedScholarships();
  }, [baseURL]);

  // Helper function to color-code status badges
  const getStatusBadge = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("review")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (s.includes("accept") || s.includes("verif")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (s.includes("reject")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Applications</h1>
          <p className="text-slate-500 mt-2">
            Track the status of your scholarship applications.
          </p>
        </div>

        {/* --- Loading State --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">
              Loading your applications...
            </p>
          </div>
        )}

        {/* --- Error State --- */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaExclamationCircle className="text-5xl text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-slate-500">{error}</p>
          </div>
        )}

        {/* --- Empty State --- */}
        {!loading && !error && scholarships.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaBoxOpen className="text-6xl text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Applications Yet
            </h3>
            <p className="text-slate-500 max-w-md text-center">
              You haven't applied for any scholarships yet. Explore available
              scholarships and start your journey!
            </p>
          </div>
        )}

        {/* --- Data Table --- */}
        {!loading && !error && scholarships.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      No.
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Scholarship Name
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scholarships.map((scholarship, index) => (
                    <tr
                      key={scholarship.scholarship_id || index}
                      className="hover:bg-slate-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-800 font-semibold">
                        {scholarship.scholarship_name}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {new Date(scholarship.applied_date).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                        ₹{scholarship.amount}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {new Date(scholarship.end_date).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(scholarship.status)}`}
                        >
                          {scholarship.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipList;
