import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import * as api from "../services/api.js";

export default function MyAppointments() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.myAppointments(token);
      setItems(Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.cancelAppointment(token, id);
      setItems(items => items.filter(i => i.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Appointments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="divide-y">
        {items.map(a => (
          <li key={a.id} className="py-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{a.doctorName || a.doctor?.fullName}</div>
              <div className="text-sm opacity-80">{a.startTime || a.slot?.startTime} • {a.status}</div>
              {a.reason && <div className="text-xs opacity-70 mt-1">Reason: {a.reason}</div>}
            </div>
            <button className="border rounded px-3 py-1" onClick={() => cancel(a.id)}>Cancel</button>
          </li>
        ))}
      </ul>
      {!loading && !error && items.length === 0 && <p>No appointments yet.</p>}
    </div>
  );
}
