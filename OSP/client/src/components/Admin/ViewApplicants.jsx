import { getStoredUserInfo } from "../../utils/storage";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContextState } from "../../context/userProvider";
import NavbarAdmin from "./AdminNavbar";

const ViewApplicants = () => {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { baseURL } = useContextState();

  useEffect(() => {
    const fetchApplicants = async () => {
      const userInfo = getStoredUserInfo();
      if (!userInfo?.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${baseURL}/api/scholarship/${id}/applicants`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${userInfo.token}`,
            },
          },
        );
        const data = await response.json().catch(() => []);
        setApplicants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching applicants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [baseURL, id]);

  const handleViewDetails = (applicantId) => {
    navigate(`/applicant-details/${applicantId}/${id}`);
  };

  const getStatusBadge = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("review"))
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (s.includes("accept") || s.includes("verif"))
      return "bg-green-100 text-green-800 border-green-200";
    if (s.includes("reject")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <NavbarAdmin />
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Applicant Roster
              </h1>
              <p className="text-slate-500 mt-2">
                Manage applications for Scholarship ID: {id}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-lg"
            >
              &larr; Back to Scholarships
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="animate-pulse">Loading applicants...</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                {/* Fixed table layout to guarantee strict column alignment */}
                <table className="w-full table-fixed border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="w-[10%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        No.
                      </th>
                      <th className="w-[35%] py-5 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="w-[20%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="w-[20%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-[15%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.length > 0 ? (
                      applicants.map((applicant, index) => (
                        <tr
                          key={applicant.id}
                          className="hover:bg-slate-50/80 transition-colors duration-150"
                        >
                          <td className="py-4 px-4 text-center text-sm text-slate-500 font-medium truncate">
                            {index + 1}
                          </td>

                          <td className="py-4 px-4 text-left truncate">
                            <div className="text-sm font-bold text-slate-800 truncate">
                              {applicant.student_name || "N/A"}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              ID: {applicant.id}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center text-sm text-slate-600 truncate">
                            {formatDate(applicant.applied_date)}
                          </td>

                          <td className="py-4 px-4 text-center truncate">
                            <span
                              className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(applicant.status)}`}
                            >
                              {applicant.status || "Pending"}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center truncate">
                            <button
                              onClick={() => handleViewDetails(applicant.id)}
                              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-6 rounded-lg shadow-sm transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-16">
                          <div className="text-slate-300 text-5xl mb-3">📄</div>
                          <p className="text-slate-500 font-medium">
                            No applicants found for this scholarship.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewApplicants;
