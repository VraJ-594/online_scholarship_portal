import { getStoredUserInfo } from "../../utils/storage";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useContextState } from "../../context/userProvider";
import "../../index.css";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";
import image3 from "./image3.jpg";
import logo from "./group7.png";

const LoginRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [selectedRole, setSelectedRole] = useState("student");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // New UI state
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { setUser, baseURL } = useContextState();
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (userInfo && userInfo.token) {
      roleCheck(userInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const img = new Image();
    img.src = image3;
    img.onload = () => setImageLoaded(true);
  }, []);

  const roleCheck = async (userInfo) => {
    try {
      const response = await fetch(`${baseURL}/api/user/authRole`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(userInfo),
      });

      const check = await response.json().catch(() => ({}));

      if (response.ok) {
        completeLogin(check);
      } else {
        localStorage.removeItem("userInfo");
        toast.error("Session expired, please log in again.");
      }
    } catch (err) {
      toast.error("Unexpected Error. Please login again.");
    }
  };

  const completeLogin = (data) => {
    localStorage.setItem("userInfo", JSON.stringify(data));
    localStorage.setItem("roleChecked", "true");
    setUser(data);

    if (data.role === "student") {
      navigate("/student");
    } else if (data.role === "admin") {
      navigate("/admin");
    }
  };

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (captchaInput !== captcha) {
      toast.error("Enter valid Captcha");
      refreshCaptcha();
      setCaptchaInput("");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
          captcha: captchaInput,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        completeLogin(data);
      } else {
        toast.error(data.message || "Login failed");
        refreshCaptcha();
        setCaptchaInput("");
      }
    } catch (error) {
      toast.error("An error occurred while logging in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/user/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        completeLogin(data);
      } else {
        toast.error(data.message || "Google sign-in failed.");
      }
    } catch (error) {
      toast.error("An error occurred during Google sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  function generateCaptcha() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
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
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            backgroundImage: `url(${image3})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundColor: "#00020b",
            filter: imageLoaded ? "blur(0px)" : "blur(16px)",
            transform: imageLoaded ? "scale(1)" : "scale(1.05)",
            opacity: imageLoaded ? 1 : 0.7,
          }}
        />
        {/* Single, real scrim -- uniform, so legibility never depends on what
            part of the photo happens to sit behind it */}
        <div className="absolute inset-0 bg-[#00020b]/50" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="" className="w-14 h-14 object-contain" />
            <h1 className="font-display text-3xl font-bold text-[#00020b] mt-3">
              OSP
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {selectedRole === "student"
                ? "Sign in with your dau.ac.in Google account"
                : "Log in to the Online Scholarship Portal"}
            </p>
          </div>

          <div className="space-y-1.5 mt-6">
            <span className="text-sm font-medium text-slate-700">Log in as</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              {["student", "admin"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-2 rounded-md text-sm font-semibold capitalize transition-colors ${
                    selectedRole === role
                      ? "bg-white text-[#00020b] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {selectedRole === "student" ? (
            <div className="flex flex-col items-center py-6">
              <GoogleLogin
                onSuccess={(credentialResponse) => handleGoogleLogin(credentialResponse.credential)}
                onError={() => toast.error("Google sign-in failed. Please try again.")}
                text="continue_with"
              />
              <p className="text-xs text-slate-400 mt-4 text-center max-w-xs">
                New here? The same button creates your account on your first sign-in --
                no separate registration needed.
              </p>
            </div>
          ) : (
            <form className="space-y-4 mt-4" onSubmit={handleLoginSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#005DFF] hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Enter the code below
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-bold tracking-widest select-none">
                    {captcha}
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="px-3 py-2 text-sm font-medium text-[#005DFF] hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                  >
                    Refresh
                  </button>
                  <input
                    type="number"
                    value={captchaInput}
                    required
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Code"
                    className="flex-1 min-w-[8rem] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005DFF] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#00020b] text-white font-semibold rounded-lg shadow-sm hover:bg-[#161a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginRegister;
