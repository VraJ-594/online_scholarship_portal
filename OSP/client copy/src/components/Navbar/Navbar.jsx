import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../index.css";
import logo from "../assets/logo.png"; // Note: Keep this as your actual file path

const NavbarStudent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const confirmSave = window.confirm("Are you sure you want to log out?");
    if (!confirmSave) {
      return;
    }
    localStorage.removeItem("userInfo");
    localStorage.removeItem("roleChecked");
    navigate("/");
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Centralizing links makes it easy to add new ones and keeps JSX clean
  const navLinks = [
    { name: "Dashboard", path: "/student" },
    { name: "Apply For Scholarship", path: "/student/scholarship" },
    { name: "Profile", path: "/student/profile" },
    { name: "FAQs", path: "/faqs" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section: Back Button & Logo */}
          <div className="flex items-center gap-4">
            {location.pathname !== "/student" && (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label="Go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            <Link to="/student" className="flex items-center gap-3">
              {/* Reduced logo size slightly to fit modern navbar heights */}
              <img
                src={logo}
                alt="OSP Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
                OSP <span className="text-blue-600 font-medium">Student</span>
              </span>
            </Link>
          </div>

          {/* Middle Section: Navigation Links (Scrollable on very small screens) */}
          <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar mx-4">
            <div className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Logout */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default NavbarStudent;