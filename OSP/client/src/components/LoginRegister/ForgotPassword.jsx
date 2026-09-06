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
        className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 sm:p-8"
        style={{
          backgroundImage: `url(${image3})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundColor: "#00020b",
        }}
      >
        <div className="absolute inset-0 bg-[#00020b]/50" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="" className="w-14 h-14 object-contain" />
            <h1 className="font-display text-3xl font-bold text-[#00020b] mt-3">
              Reset your password
            </h1>
          </div>

          {/* Step indicator -- this is a genuine 3-step sequence */}
          <ol className="flex items-center justify-center gap-2 mt-5 mb-6">
            {["Email", "Verify", "Reset"].map((label, i) => {
              const stepIndex = otpVerified ? 2 : otpSent ? 1 : 0;
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      isCurrent
                        ? "text-[#00020b]"
                        : isDone
                        ? "text-[#005DFF]"
                        : "text-slate-300"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isCurrent
                          ? "bg-[#00020b] text-white"
                          : isDone
                          ? "bg-[#005DFF] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {label}
                  </span>
                  {i < 2 && <span className="w-4 h-px bg-slate-200" />}
                </li>
              );
            })}
          </ol>

          {/* Step 1: Request OTP */}
          {!otpSent && !otpVerified && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="Your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingEmail}
                className="w-full py-2.5 bg-[#00020b] text-white font-semibold rounded-lg shadow-sm hover:bg-[#161a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingEmail ? "Sending..." : "Send verification code"}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {otpSent && !otpVerified && (
            <form onSubmit={handleOtpVerification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Verification code
                </label>
                <input
                  type="text"
                  placeholder="Enter the code sent to your email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingOtp}
                className="w-full py-2.5 bg-[#00020b] text-white font-semibold rounded-lg shadow-sm hover:bg-[#161a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingOtp ? "Verifying..." : "Verify code"}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {otpVerified && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                  >
                    {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoadingPassword}
                className="w-full py-2.5 bg-[#00020b] text-white font-semibold rounded-lg shadow-sm hover:bg-[#161a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPassword ? "Updating..." : "Reset password"}
              </button>
            </form>
          )}

          <div className="flex items-center justify-center mt-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#005DFF] hover:underline"
            >
              <FaArrowLeft className="text-xs" />
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;