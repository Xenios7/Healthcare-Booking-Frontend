import { createContext, useContext, useEffect, useState } from "react";
// If you use axios, uncomment the next line
// import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : { token: null, role: null, user: null };
  });

  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
    // If you use axios, keep the Authorization header in sync:
    // if (auth.token) axios.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
    // else delete axios.defaults.headers.common.Authorization;
  }, [auth]);

  const login = (data) => setAuth(data);
  const logout = () => setAuth({ token: null, role: null, user: null });

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
