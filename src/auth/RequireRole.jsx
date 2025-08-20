// src/auth/RequireRole.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { hasRole } from "./roles.js";

export default function RequireRole({ allowed, children }) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(role, allowed)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
