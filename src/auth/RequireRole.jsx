import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { normalizeRole } from "./roles";

export default function RequireRole({ allowed, children }) {
  const { role } = useAuth();
  const location = useLocation();

  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const r = normalizeRole(role);
  return allowed.includes(r) ? children : <Navigate to="/403" replace />;
}
