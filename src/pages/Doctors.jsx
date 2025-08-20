import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import * as api from "../services/api.js";

export default function Doctors() {
  const { token } = useAuth();
  const [speciality, setSpeciality] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciality]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listDoctors(token, { speciality });
      setDoctors(Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Doctors</h1>
      <div className="flex gap-2 items-end">
        <label className="flex flex-col text-sm">
          Speciality
          <input className="border rounded px-3 py-2" value={speciality} onChange={e=>setSpeciality(e.target.value)} placeholder="e.g. Cardiology" />
        </label>
        <button className="border rounded px-3 py-2" onClick={load}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul className="divide-y">
        {doctors.map(d => (
          <li key={d.id} className="py-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{d.fullName || `${d.firstName || ""} ${d.lastName || ""}`}</div>
              <div className="text-sm opacity-75">{d.speciality}</div>
            </div>
            <Link to={`/doctors/${d.id}`} className="border rounded px-3 py-1">View</Link>
          </li>
        ))}
      </ul>

      {!loading && !error && doctors.length === 0 && <p>No doctors found.</p>}
    </div>
  );
}
