import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import * as api from "../services/api.js";

export default function DoctorDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getDoctor(token, id);
        setDoctor(d);
      } catch {}
      try {
        const s = await api.listSlots(token, { doctorId: id });
        setSlots(Array.isArray(s?.content) ? s.content : (Array.isArray(s) ? s : []));
      } catch {}
    })();
  }, [id, token]);

  async function book(slotId) {
    setLoading(true);
    setMsg("");
    try {
      await api.bookAppointment(token, { doctorId: id, slotId, reason });
      setMsg("Booked! Check 'My Appointments'.");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {doctor ? (
        <div className="border rounded p-4">
          <h1 className="text-xl font-semibold">{doctor.fullName || doctor.name}</h1>
          <p className="opacity-80">{doctor.speciality}</p>
        </div>
      ) : <h1 className="text-xl font-semibold">Doctor</h1>}

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-medium">Available slots</h2>
        <label className="flex flex-col text-sm max-w-lg">
          Reason (optional)
          <input className="border rounded px-3 py-2" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe your issue briefly" />
        </label>
        <ul className="divide-y">
          {slots.map(s => (
            <li key={s.id} className="py-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{s.startTime || s.start || s.dateTime}</div>
                <div className="text-xs opacity-70">{s.duration ? `${s.duration} mins` : ""}</div>
              </div>
              <button disabled={loading} onClick={() => book(s.id)} className="border rounded px-3 py-1">
                {loading ? "Booking..." : "Book"}
              </button>
            </li>
          ))}
        </ul>
        {slots.length === 0 && <p>No available slots.</p>}
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </div>
  );
}
