import { getStoredUserInfo } from "../../utils/storage";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContextState, authHeaders } from "../../context/userProvider";
import "../../index.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { baseURL } = useContextState();

  // State Management
  const [scholarships, setScholarships] = useState([]);
  const [ispending, setIspending] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch API Trigger
  useEffect(() => {
    const fetchScholarships = async () => {
      const userInfo = getStoredUserInfo();

      if (!userInfo?.token) {
        setError("You must be logged in to view scholarships.");
        setIspending(false);
        return;
      }

      setIspending(true);
      setError(null);

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

        if (!response.ok) {
          throw new Error("Failed to load scholarships.");
        }

        const jsonResponse = await response.json();

        // Safely map the paginated JSON structure we created in the backend
        const scholarshipData = jsonResponse?.data || [];
        const metadata = jsonResponse?.meta || { totalPages: 1 };

        setScholarships(scholarshipData);
        setTotalPages(Number(metadata.totalPages) || 1);
      } catch (err) {
        console.error("Error fetching scholarships:", err);
        setScholarships([]);
        setTotalPages(1);
        setError(err.message);
      } finally {
        setIspending(false);
      }
    };

    fetchScholarships();
  }, [baseURL, page, searchTerm]); // Auto-refetches when page or search changes

  // Handlers
  const handleViewScholarship = (scholarshipId) => {
    navigate(`/admin/viewscholarship/${scholarshipId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedInput = searchInput.trim();
    setSearchTerm(trimmedInput);
    setPage(1); // Always reset to page 1 on a new search
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header + Search Bar */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Manage Scholarships
            </h1>
            <p className="text-slate-500 mt-2">
              View and manage all active scholarship programs.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search by scholarship name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xl font-medium leading-none"
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <button
              type="submit"
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading State */}
        {ispending && (
          <div className="flex justify-center items-center py-20">
            <div className="text-slate-500 font-medium text-lg animate-pulse">
              Loading scholarships...
            </div>
          </div>
        )}

        {/* Error State */}
        {!ispending && error && (
          <div className="flex justify-center items-center py-20">
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg font-medium">
              {error}
            </div>
          </div>
        )}

        {/* Scholarship Grid */}
        {!ispending && !error && scholarships.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.scholarship_id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <img
                    src="/imgdaiict.jpg"
                    alt="Scholarship Logo"
                    className="w-20 h-20 object-cover rounded-full mb-4 shadow-sm border-2 border-slate-100"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/150?text=Scholarship";
                    }}
                  />
                  <h2 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {scholarship.scholarship_name}
                  </h2>
                  <div className="w-full bg-slate-50 rounded-lg py-3 px-4 mb-6 space-y-2 border border-slate-100">
                    <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                      Amount
                    </div>
                    <div className="text-blue-600 text-2xl font-bold">
                      ₹{Number(scholarship.amount).toLocaleString("en-IN")}
                    </div>
                    <div className="text-slate-500 text-sm">
                      <span className="font-semibold">Ends:</span>{" "}
                      {new Date(scholarship.end_date).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </div>
                    <div className="text-slate-500 text-sm">
                      <span className="font-semibold">Applicants:</span>{" "}
                      {scholarship.applicants_count || 0}
                    </div>
                  </div>
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 mt-auto"
                    onClick={() =>
                      handleViewScholarship(scholarship.scholarship_id)
                    }
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
                >
                  &larr; Previous
                </button>
                <span className="text-sm font-bold text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!ispending && !error && scholarships.length === 0 && (
          <div className="text-center py-20">
            <div className="text-slate-400 text-5xl mb-4">🎓</div>
            <h2 className="text-xl font-semibold text-slate-700">
              {searchTerm
                ? "No scholarships found"
                : "No scholarships available"}
            </h2>
            <p className="text-slate-500 mt-2">
              {searchTerm
                ? `No scholarships matched "${searchTerm}".`
                : "There are currently no scholarship programs to display."}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                View All Scholarships
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
