// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Doctors from "./pages/Doctors.jsx";
import DoctorDetail from "./pages/DoctorDetail.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";
import Signup from "./pages/Signup.jsx";

function RequireAuth({ children, role }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Normalize roles so we accept "ADMIN" or "ROLE_ADMIN", string or array.
  if (role) {
    const normalize = (r) => String(r || "").replace(/^ROLE_/, "").toUpperCase();
    const wanted = normalize(role);

    const strRole = normalize(user?.role);
    const arrRoles = Array.isArray(user?.roles) ? user.roles.map(normalize) : [];

    const hasRole = strRole === wanted || arrRoles.includes(wanted);
    if (!hasRole) return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="max-w-5xl mx-auto w-full p-4 flex-1">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Single signup (patient self-signup) + single login */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* Public browsing of doctors */}
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />

            {/* Protected areas */}
            <Route
              path="/me/appointments"
              element={
                <RequireAuth>
                  <MyAppointments />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth role="ADMIN">
                  <Admin />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}
