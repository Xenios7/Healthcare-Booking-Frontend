import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Home() {
  const { token, user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome{user?.fullName ? `, ${user.fullName}` : ""}!</h1>
      {!token ? (
        <div className="border rounded p-4">
          <p>You are not logged in.</p>
          <Link to="/login" className="underline">Go to login</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card title="Find a Doctor" to="/doctors" desc="Browse doctors and available slots, then book." />
          <Card title="My Appointments" to="/me/appointments" desc="See upcoming and past appointments." />
          {(user?.roles || []).includes("ROLE_ADMIN") && (
            <Card title="Admin" to="/admin" desc="Manage doctors, patients, slots." />
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <Link to={to} className="border rounded p-4 hover:shadow">
      <h2 className="font-medium">{title}</h2>
      <p className="opacity-80 text-sm mt-1">{desc}</p>
    </Link>
  );
}
