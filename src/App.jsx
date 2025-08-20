// src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";

import Forbidden from "./pages/Forbidden.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DoctorSlotsNew from "./pages/DoctorSlotsNew.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import RequireRole from "./auth/RequireRole.jsx"; // you already have this

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

            {/* Dashboards */}
            <Route
              path="/patient"
              element={
                <RequireRole anyOf={["PATIENT", "ROLE_PATIENT"]}>
                  <PatientDashboard />
                </RequireRole>
              }
            />

            <Route
              path="/doctor"
              element={
                <RequireRole anyOf={["DOCTOR", "ROLE_DOCTOR"]}>
                  <DoctorDashboard />
                </RequireRole>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireRole anyOf={["ADMIN", "ROLE_ADMIN"]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />

            {/* Doctor sub-pages (placeholders) */}
            <Route
              path="/doctor/slots/new"
              element={
                <RequireRole anyOf={["DOCTOR", "ROLE_DOCTOR"]}>
                  <DoctorSlotsNew />
                </RequireRole>
              }
            />
            <Route
              path="/doctor/slots"
              element={
                <RequireRole anyOf={["DOCTOR", "ROLE_DOCTOR"]}>
                  <ComingSoon title="My Slots" />
                </RequireRole>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <RequireRole anyOf={["DOCTOR", "ROLE_DOCTOR"]}>
                  <ComingSoon title="Doctor Appointments" />
                </RequireRole>
              }
            />

            {/* Admin sub-pages (placeholders) */}
            <Route
              path="/admin/doctors/new"
              element={
                <RequireRole anyOf={["ADMIN", "ROLE_ADMIN"]}>
                  <ComingSoon title="Create Doctor" />
                </RequireRole>
              }
            />
            <Route
              path="/admin/admins/new"
              element={
                <RequireRole anyOf={["ADMIN", "ROLE_ADMIN"]}>
                  <ComingSoon title="Create Admin" />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole anyOf={["ADMIN", "ROLE_ADMIN"]}>
                  <ComingSoon title="Manage Users" />
                </RequireRole>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <RequireRole anyOf={["ADMIN", "ROLE_ADMIN"]}>
                  <ComingSoon title="All Appointments" />
                </RequireRole>
              }
            />

            {/* Patient sub-page */}
            <Route
              path="/me/profile"
              element={
                <RequireRole anyOf={["PATIENT", "ROLE_PATIENT"]}>
                  <ComingSoon title="My Profile" />
                </RequireRole>
              }
            />

            <Route path="/403" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}
