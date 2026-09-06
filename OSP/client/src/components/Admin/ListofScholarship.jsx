import { getStoredUserInfo } from "../../utils/storage";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContextState, authHeaders } from "../../context/userProvider";
import NavbarAdmin from "./AdminNavbar";
import "../../index.css";

const ListofScholarship = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10; // Show 10 scholarships per page

  const navigate = useNavigate();
  const { baseURL } = useContextState();

  useEffect(() => {
    const fetchScholarships = async () => {
      const userInfo = getStoredUserInfo();
      if (!userInfo?.token) return;

      setLoading(true);
      try {
        const response = await fetch(
          `${baseURL}/api/scholarship/getScholarships?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          },
        );
        const jsonResponse = await response
          .json()
          .catch(() => ({ data: [], meta: {} }));

        setScholarships(jsonResponse.data || []);
        setTotalPages(jsonResponse.meta?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching scholarships:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScholarships();
  }, [baseURL, page, searchTerm]);

  const handleViewApplicants = (id) => {
    navigate(`/scholarships/${id}/applicants`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setPage(1); // Reset to page 1 on search
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  return (
    <>
      <NavbarAdmin />
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* Header & Search Bar Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Scholarship Applicants
              </h1>
              <p className="text-slate-500 mt-2">
                Select a scholarship to view its applicant pool.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <input
                type="text"
                placeholder="Search scholarships..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full md:w-72 px-4 py-2.5 bg-white border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-r-lg font-semibold transition-colors"
              >
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="ml-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="animate-pulse">Loading scholarships...</div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Fixed layout matching the exact design proportions of your roster */}
                  <table className="w-full table-fixed border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="w-[8%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          No.
                        </th>
                        <th className="w-[15%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="w-[45%] py-5 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Scholarship Name
                        </th>
                        <th className="w-[16%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Applicants
                        </th>
                        <th className="w-[16%] py-5 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scholarships.length > 0 ? (
                        scholarships.map((scholarship, index) => (
                          <tr
                            key={scholarship.scholarship_id}
                            className="hover:bg-slate-50/80 transition-colors duration-150"
                          >
                            <td className="py-4 px-4 text-center text-sm text-slate-500 font-medium truncate">
                              {(page - 1) * limit + index + 1}
                            </td>
                            <td className="py-4 px-4 text-center text-sm text-slate-500 truncate">
                              {scholarship.scholarship_id}
                            </td>
                            <td className="py-4 px-4 text-left truncate">
                              <span className="text-sm text-slate-800 font-bold truncate block">
                                {scholarship.scholarship_name}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center truncate">
                              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                {scholarship.applicants_count || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center truncate">
                              <button
                                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-6 rounded-lg shadow-sm transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                onClick={() =>
                                  handleViewApplicants(
                                    scholarship.scholarship_id,
                                  )
                                }
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-16">
                            <div className="text-slate-300 text-5xl mb-3">
                              🎓
                            </div>
                            <p className="text-slate-500 font-medium">
                              {searchTerm
                                ? `No scholarships matched "${searchTerm}".`
                                : "No scholarships found matching your criteria."}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ListofScholarship;
