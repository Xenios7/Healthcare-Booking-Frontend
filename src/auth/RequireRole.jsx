import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { hasRole } from "./roles";

export default function RequireRole({ allowed, children }) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(role, allowed)) {
    // optional: quick debug
    // console.warn("RequireRole blocked:", { myRole: role, allowed });
    return <Navigate to="/403" replace />;
  }

  return children;
}
