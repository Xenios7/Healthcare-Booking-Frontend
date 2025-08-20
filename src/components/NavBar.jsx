import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function NavBar() {
  const { token, logout, user } = useAuth();
  const nav = useNavigate();

  // Works with either: user.role === "ADMIN" or user.roles === ["ROLE_ADMIN"]
  const roles = user?.roles || [];
  const role = user?.role || (roles[0]?.replace(/^ROLE_/, "") ?? null);

const isAdmin =
  user?.role === "ADMIN" ||
  (user?.roles || []).includes("ROLE_ADMIN") ||
  (user?.authorities || []).some(a => a === "ROLE_ADMIN" || a === "ADMIN");
  const isDoctor = role === "DOCTOR" || roles.includes("ROLE_DOCTOR");

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <nav className="container-fluid app-nav">
      {/* Left: brand + main links */}
      <ul>
        <li>
          <Link to="/" className="brand">
            <strong>Medical Booking</strong>
          </Link>
        </li>
        <li><NavLink to="/" end>Home</NavLink></li>

        {/* Patients/guests can browse doctors; hide for doctors */}
        {!isDoctor && <li><NavLink to="/doctors">Doctors</NavLink></li>}

        {/* Only for signed-in non-doctors */}
        {token && !isDoctor && (
          <li><NavLink to="/me/appointments">My Appointments</NavLink></li>
        )}

        {isAdmin && <li><NavLink to="/admin">Admin</NavLink></li>}
      </ul>

      {/* Right: auth actions */}
      <ul>
        {!token ? (
          <>
            <li><Link to="/login" role="button" className="secondary">Log in</Link></li>
            <li><Link to="/signup" role="button">Sign up</Link></li>
          </>
        ) : (
          <li><button onClick={handleLogout} className="secondary">Logout</button></li>
        )}
      </ul>
    </nav>
  );
}
