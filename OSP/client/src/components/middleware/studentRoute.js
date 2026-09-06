import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useContextState } from "../../context/userProvider";

const StudentRoute = ({ children }) => {
  const { user, baseURL, setUser } = useContextState();
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");

    if (!storedUserInfo) {
      navigate("/");
      return;
    }

    const userInfo = JSON.parse(storedUserInfo);
    setUser(userInfo);

    const storedRoleChecked = localStorage.getItem("roleChecked");
    if (storedRoleChecked === "true" && userInfo?.role === "student") {
      setIsVerifying(false);
      return;
    }

    const verifyRole = async () => {
      try {
        const response = await fetch(`${baseURL}/api/user/authRole`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userInfo.token}`,
          },
          body: JSON.stringify(userInfo),
        });

        const result = await response.json();
        if (response.ok && result.role === "student") {
          localStorage.setItem("roleChecked", "true");
          setIsVerifying(false);
        } else {
          throw new Error("Not authorized");
        }
      } catch {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("roleChecked");
        navigate("/");
      }
    };

    verifyRole();
  }, [baseURL, navigate, setUser]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium">Verifying authorization...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/" />;
};

export default StudentRoute;