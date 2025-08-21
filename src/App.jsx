// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

import RequireRole from "./auth/RequireRole.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import NotFound from "./pages/NotFound.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Doctors from "./pages/Doctors.jsx";
import DoctorDetail from "./pages/DoctorDetail.jsx";
// import MyAppointments from "./pages/MyAppointments.jsx"; // replaced by AppointmentsPage
import AppointmentsPage from "./pages/AppointmentsPage.jsx";

import PatientDashboard from "./pages/PatientDashboard.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DoctorSlotsNew from "./pages/DoctorSlotsNew.jsx";
import DoctorSlots from "./pages/DoctorSlots.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import MyProfile from "./pages/MyProfile.jsx";

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <div className="max-w-5xl mx-auto w-full p-4">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />

          {/* Role homes */}
          <Route
            path="/patient"
            element={
              <RequireRole allowed={["PATIENT"]}>
                <PatientDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/doctor"
            element={
              <RequireRole allowed={["DOCTOR"]}>
                <DoctorDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole allowed={["ADMIN"]}>
                <AdminDashboard />
              </RequireRole>
            }
          />

          {/* Patient-only pages */}
          <Route
            path="/me/appointments"
            element={
              <RequireRole allowed={["PATIENT"]}>
                <AppointmentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/me/profile"
            element={
              <RequireRole allowed={["PATIENT"]}>
                <ComingSoon title="My Profile" />
                <MyProfile />
              </RequireRole>
            }
          />

          {/* Doctor-only pages */}
          <Route
            path="/doctor/slots/new"
            element={
              <RequireRole allowed={["DOCTOR"]}>
                <DoctorSlotsNew />
              </RequireRole>
            }
          />

          <Route
            path="/doctor/slots"
            element={
              <RequireRole allowed={["DOCTOR"]}>
                <ComingSoon title="My Slots" />
                <DoctorSlots />
              </RequireRole>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <RequireRole allowed={["DOCTOR"]}>
                <AppointmentsPage />
              </RequireRole>
            }
          />

          {/* Admin-only pages */}
          <Route
            path="/admin/doctors/new"
            element={
              <RequireRole allowed={["ADMIN"]}>
                <ComingSoon title="Create Doctor" />
              </RequireRole>
            }
          />
          <Route
            path="/admin/admins/new"
            element={
              <RequireRole allowed={["ADMIN"]}>
                <ComingSoon title="Create Admin" />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole allowed={["ADMIN"]}>
                <ComingSoon title="Manage Users" />
              </RequireRole>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <RequireRole allowed={["ADMIN"]}>
                <AppointmentsPage />
              </RequireRole>
            }
          />

          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
