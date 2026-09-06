import React, { useState, useEffect } from "react";
import { FaUnlock, FaLock } from "react-icons/fa";
import { useContextState } from "../../context/userProvider";
import { ToastContainer, toast, Bounce } from "react-toastify";
import NavbarAdmin from "./Navbar.jsx";

const AdminProfile = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const { baseURL } = useContextState();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    photo: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp",
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const obj = JSON.parse(localStorage.getItem("userInfo"));
        if (!obj?.email) return;

        const response = await fetch(`${baseURL}/api/user/getuserprofile?email=${obj.email}`, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userInfo.token}`,
          },
        });
        
        if (!response.ok) throw new Error("Could not fetch profile");
        
        const data = await response.json().catch(() => ({}));
        setProfile((prev) => ({
          ...prev,
          name: data.username || "",
          email: data.email || obj.email,
        }));
      } catch (error) {
        toast.error("Failed to load profile data.");
      }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const obj = JSON.parse(localStorage.getItem("userInfo"));
      
      const response = await fetch(`${baseURL}/api/user/updateuserprofile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({
          email: obj.email,
          name: profile.name,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Error saving profile changes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NavbarAdmin />
      <ToastContainer position="top-right" autoClose={2000} theme="light" transition={Bounce} />
      
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <div className="px-8 pb-8 pt-0 text-center relative">
            {/* Avatar */}
            <div className="relative inline-block -mt-16 mb-4">
              <img
                src={profile.photo}
                alt="Admin Avatar"
                className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-md bg-white"
              />
            </div>

            {isEditing ? (
              <div className="space-y-4 mt-2">
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    placeholder="Admin Name"
                  />
                  <FaUnlock className="absolute right-3.5 top-3.5 text-slate-400" />
                </div>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    placeholder="Email Address"
                  />
                  <FaLock className="absolute right-3.5 top-3.5 text-slate-300" />
                </div>
              </div>
            ) : (
              <div className="mt-2 mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{profile.name || "Admin User"}</h3>
                <p className="text-slate-500 font-medium mt-1">{profile.email || "No email provided"}</p>
              </div>
            )}

            <div className="mt-8">
              <button
                className={`w-full py-2.5 px-4 rounded-lg font-semibold shadow-sm transition-colors ${
                  isEditing 
                    ? "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={isEditing ? handleSave : toggleEditMode}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;