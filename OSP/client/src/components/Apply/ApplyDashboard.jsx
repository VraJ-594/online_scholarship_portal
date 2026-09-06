import React from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import NavbarStudent from "../Navbar/StudentNavbar";
import { useContextState } from "../../context/userProvider";
import imgdaiict from "../assets/imgdaiict.jpg";
import "../../index.css";

const ApplyDashboard = () => {
  const navigate = useNavigate();
  const { baseURL } = useContextState();

  // Dynamically fetch using the environment base URL
  const {
    data: scholarships,
    ispending,
    error,
  } = useFetch(`${baseURL}/api/user/getlistforApplyscholarships`);

  const handleViewScholarship = (scholarship_id) => {
    navigate(`/student/viewscholarship/${scholarship_id}`);
  };

  return (
    <>
      <NavbarStudent />
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Apply for Scholarships
          </h1>
          <p className="text-slate-500 mt-2">
            Discover and apply for available scholarship programs.
          </p>
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
        {error && (
          <div className="flex justify-center items-center py-20">
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg font-medium">
              {error}
            </div>
          </div>
        )}

        {/* Data Grid */}
        {scholarships && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((scholarship) => (
              <div
                key={scholarship.scholarship_id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                {/* Image */}
                <img
                  src={imgdaiict}
                  alt="Scholarship Logo"
                  className="w-20 h-20 object-cover rounded-full mb-4 shadow-sm border-2 border-slate-100"
                  onError={(e) => {
                    // Fallback if local image fails to load
                    e.target.src = "https://via.placeholder.com/150?text=Scholarship";
                  }}
                />

                {/* Title */}
                <h2 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                  {scholarship.scholarship_name}
                </h2>

                {/* Details Container */}
                <div className="w-full bg-slate-50 rounded-lg py-3 px-4 mb-6 space-y-1 border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                    Amount
                  </div>
                  <div className="text-blue-600 text-2xl font-bold">
                    ₹{scholarship.amount}
                  </div>
                  <div className="text-slate-500 text-sm mt-2">
                    <span className="font-semibold">Ends:</span>{" "}
                    {new Date(scholarship.end_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
                  onClick={() =>
                    handleViewScholarship(scholarship.scholarship_id)
                  }
                >
                  View Scholarship Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ApplyDashboard;