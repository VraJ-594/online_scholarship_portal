import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { useContextState } from "../../context/userProvider";
import "../../index.css";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/group7.png";
import image3 from "../assets/image3.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  
  // UI State for UX improvements
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { baseURL } = useContextState();
  const navigate = useNavigate();

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setIsLoadingEmail(true);
    try {
      const response = await fetch(`${baseURL}/api/passwordreset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success(`Password reset link sent to ${email}`);
        setOtpSent(true);
      } else {
        toast.error(data.message || "There was an error sending the OTP.");
      }
    } catch (err) {
      toast.error("Network error while sending OTP. Please try again.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleOtpVerification = async (event) => {
    event.preventDefault();
    setIsLoadingOtp(true);
    try {
      // Fixed leading space in the URL
      const response = await fetch(`${baseURL}/api/passwordreset/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otp,
          email: email,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success("OTP verified successfully");
        setOtpVerified(true);
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      toast.error("Network error while verifying OTP. Please try again.");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }
    
    setIsLoadingPassword(true);
    try {
      const response = await fetch(`${baseURL}/api/passwordreset/setnewpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          newPassword: newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast.success("Password updated successfully!");

        // Reset state
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
        setOtpVerified(false);
        
        // Slight delay so the user can read the success toast before redirecting
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(data.message || "There was an error updating your password.");
      }
    } catch (err) {
      toast.error("Network error while updating password. Please try again.");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        limit={2}
        newestOnTop={true}
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <div
        className="p-8 bg-white min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${image3})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
        }}
      >
        <div className="w-full max-w-lg bg-gradient-to-br from-blue-600/40 to-blue-600/40 rounded-xl shadow-lg p-6 border border-white/20">
          
          {/* Header & Logo */}
          <div className="flex items-center justify-center space-x-4">
            <img
              src={logo}
              alt="Logo"
              className="w-20 h-20 object-contain animate-pulse-grow"
            />
            <div className="text-5xl text-blue-950 font-extrabold drop-shadow-sm animate-fade-in">
              OSP
            </div>
          </div>
          <h2 className="text-3xl font-bold text-black mt-4 mb-6 text-center drop-shadow-sm animate-fade-in">
            Forgot Password
          </h2>

          {/* Form Step 1: Request OTP */}
          {!otpSent && !otpVerified && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-black/90">Email</label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white backdrop-blur-sm rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingEmail}
                className="w-full py-2 bg-white/40 backdrop-blur-sm text-black font-semibold rounded-lg shadow-lg hover:bg-white/10 border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingEmail ? "Sending..." : "Send Password Reset Link"}
              </button>
            </form>
          )}

          {/* Form Step 2: Verify OTP */}
          {otpSent && !otpVerified && (
            <form onSubmit={handleOtpVerification} className="space-y-4">
              <div className="space-y-2">
                <label className="text-black/90">Verification OTP</label>
                <input
                  type="text"
                  placeholder="Enter the OTP sent to your email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white backdrop-blur-sm rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingOtp}
                className="w-full py-2 bg-white/40 backdrop-blur-sm text-black font-semibold rounded-lg shadow-lg hover:bg-white/10 border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {/* Form Step 3: Reset Password */}
          {otpVerified && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-black/90">New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white backdrop-blur-sm rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-slate-600"
                  />
                  <span 
                    className="absolute inset-y-0 right-3 flex items-center text-black/70 cursor-pointer"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-black/90">Confirm Password</label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white backdrop-blur-sm rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-slate-600"
                  />
                  <span 
                    className="absolute inset-y-0 right-3 flex items-center text-black/70 cursor-pointer"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoadingPassword}
                className="w-full py-2 bg-white/40 backdrop-blur-sm text-black font-semibold rounded-lg shadow-lg hover:bg-white/10 border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPassword ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Back to Login Navigation */}
          <div className="flex items-center justify-center mt-6">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-white bg-blue-800/30 rounded-full px-4 py-2 font-semibold cursor-pointer hover:underline transition-all"
            >
              <FaArrowLeft className="text-sm" />
              <span>Back to Login</span>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default ForgotPassword;