import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const norm = (v) => (v ? String(v).toUpperCase().replace(/^ROLE_/, "") : "");

export default function RequireRole({ allowed, children }) {
  const { token, role } = useAuth();      // role should become "PATIENT"
  const location = useLocation();

  // Not signed in → go login
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  // Signed in but role not resolved yet (briefly after refresh) → show a tiny loader
  if (!role) return <div aria-busy="true" style={{ padding: 16 }}>Loading…</div>;

  // Gate by normalized role
  const r = norm(role);
  return allowed.map(norm).includes(r)
    ? children
    : <Navigate to="/403" replace />;
}
