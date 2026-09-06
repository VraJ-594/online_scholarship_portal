import { getStoredUserInfo } from "../utils/storage";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUserInfo());
  const [baseURL] = useState(
    process.env.REACT_APP_API_URL || "http://localhost:8080"
  );
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    setUser(userInfo);
    // if (!user) {
    //   navigate('/');
    // }
  }, [navigate]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        baseURL,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useContextState = () => {
  return useContext(UserContext);
};

export const authHeaders = () => {
  const userInfo = getStoredUserInfo();

  return userInfo?.token
    ? {
        Authorization: `Bearer ${userInfo.token}`,
      }
    : {};
};

export default UserProvider;


