// src/pages/DoctorSlotsNew.jsx
// Create available slots for the logged-in doctor.
// Endpoints used (as per your controller):
//   GET  /api/doctors/me                                  -> fetch current doctor (id)
//   POST /api/appointmentSlots                            -> create a slot (SlotCreateDTO)
//   GET  /api/appointmentSlots/by-doctor/{doctorId}       -> all slots for doctor
//   GET  /api/appointmentSlots/by-doctor/{doctorId}/available -> available slots (LIST)
//   GET  /api/appointmentSlots/by-doctor/{doctorId}/available/sorted -> FIRST available slot (SINGLE obj)
// NOTE: The "/available/sorted" endpoint returns a SINGLE AppointmentSlotDTO, not a list.
// This UI uses the LIST endpoint to show existing slots, and also shows the earliest one separately.

import React from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

async function api(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try { message = JSON.parse(text)?.message || text; } catch {}
    throw new Error(message || res.statusText);
  }
  try { return JSON.parse(text); } catch { return text; }
}

function toLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  const [H, M] = timeStr.split(":");
  const hh = String(H).padStart(2, "0");
  const mm = String(M).padStart(2, "0");
  // Java LocalDateTime format
  return `${dateStr}T${hh}:${mm}:00`;
}

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(n => parseInt(n || "0", 10));
  const total = h * 60 + m + Number(minutes);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export default function DoctorSlotsNew() {
  const [me, setMe] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // form state
  const [date, setDate] = React.useState(""); // YYYY-MM-DD
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");
  const [duration, setDuration] = React.useState(30); // minutes
  const [location, setLocation] = React.useState("");

  const [preview, setPreview] = React.useState([]); // [{ start, end }]
  const [existing, setExisting] = React.useState([]); // list of available slots
  const [earliest, setEarliest] = React.useState(null); // single

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await api("/api/doctors/me");
        setMe(d);
        await reloadSlots(d.id);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function reloadSlots(doctorId) {
    try {
      const list = await api(`/api/appointmentSlots/by-doctor/${doctorId}/available`).catch(() => []);
      setExisting(Array.isArray(list) ? list : []);
      // earliest (may 404 if none)
      try {
        const first = await api(`/api/appointmentSlots/by-doctor/${doctorId}/available/sorted`);
        setEarliest(first || null);
      } catch {
        setEarliest(null);
      }
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  function buildPreview() {
    setError("");
    setSuccess("");
    if (!date || !startTime || !endTime || !duration) return setPreview([]);
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return setPreview([]);
    }
    const out = [];
    let t = startTime;
    const maxIter = 24 * 60; // guard
    let iter = 0;
    while (t < endTime && iter < maxIter) {
      const nxt = addMinutes(t, duration);
      if (nxt > endTime) break;
      out.push({ start: t, end: nxt });
      t = nxt;
      iter++;
    }
    setPreview(out);
  }

  async function createAll() {
    if (!me?.id) return;
    if (!date || !startTime || !endTime || !duration || Number(duration) <= 0) {
      return setError("Please fill date, start/end time, and a positive duration.");
    }
    setError("");
    setSuccess("");

    // Build segments from current inputs if no preview exists
    let segments = preview;
    if (!segments || segments.length === 0) {
      const out = [];
      if (endTime <= startTime) {
        setError("End time must be after start time.");
        return;
      }
      let t = startTime;
      const maxIter = 24 * 60; // guard
      let iter = 0;
      while (t < endTime && iter < maxIter) {
        const nxt = addMinutes(t, duration);
        if (nxt > endTime) break;
        out.push({ start: t, end: nxt });
        t = nxt;
        iter++;
      }
      segments = out;
    }

    if (!segments || segments.length === 0) {
      setError("Nothing to create. Adjust times or duration, then try again.");
      return;
    }

    try {
      for (const p of segments) {
        const payload = {
          doctorId: me.id,
          startTime: toLocalDateTime(date, p.start),
          endTime: toLocalDateTime(date, p.end),
          ...(location ? { location } : {}),
        };
        await api("/api/appointmentSlots", { method: "POST", body: payload });
      }
      setSuccess(`Created ${segments.length} slot(s).`);
      setPreview([]);
      await reloadSlots(me.id);
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  function pretty(dt) {
    try { return new Date(dt).toLocaleString(); } catch { return String(dt); }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Create Time Slots</h1>
      {loading && <p className="mt-2 text-gray-500">Loading…</p>}
      {error && <div className="mt-3 p-3 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}
      {success && <div className="mt-3 p-3 rounded bg-green-100 text-green-800 border border-green-200">{success}</div>}

      {me && (
        <div className="mt-4 p-3 border rounded">
          <div className="text-sm text-gray-600">Doctor</div>
          <div className="font-medium">{me.fullName || me.name || me.email} (ID: {me.id})</div>
        </div>
      )}

      <section className="mt-6 p-4 border rounded space-y-3">
        <h2 className="text-lg font-semibold">New slot(s)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm">Date</span>
            <input type="date" className="border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Location (optional)</span>
            <input className="border rounded px-3 py-2" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g., Clinic A, Room 3" />
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span className="text-sm">Start time</span>
            <input type="time" className="border rounded px-3 py-2" value={startTime} onChange={e=>setStartTime(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">End time</span>
            <input type="time" className="border rounded px-3 py-2" value={endTime} onChange={e=>setEndTime(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Duration (minutes)</span>
            <input type="number" min="5" step="5" className="border rounded px-3 py-2" value={duration} onChange={e=>setDuration(Number(e.target.value))} />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={buildPreview}>Preview slots</button>
          <button type="button" className="px-4 py-2 rounded bg-black text-white" onClick={createAll} disabled={!date || !startTime || !endTime || !duration || Number(duration) <= 0 || endTime <= startTime}>Create</button>
        </div>
        {preview.length>0 && (
          <div className="mt-2 text-sm text-gray-600">{preview.length} slot(s) will be created for {date}.</div>
        )}
        {preview.length>0 && (
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            {preview.map((p,i)=> (
              <div key={i} className="p-2 border rounded text-sm">
                {p.start} – {p.end}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 p-4 border rounded">
        <h2 className="text-lg font-semibold">Existing available slots</h2>
        {earliest && (
          <div className="mb-2 text-sm">Earliest free slot: <span className="font-medium">{pretty(earliest.startTime)} – {pretty(earliest.endTime)}</span></div>
        )}
        {existing.length === 0 && <div className="text-sm text-gray-500">No free slots.</div>}
        <div className="grid md:grid-cols-2 gap-2 mt-2">
          {existing.map(s => (
            <div key={s.id} className="p-2 border rounded text-sm">
              <div className="font-medium">#{s.id}</div>
              <div>{pretty(s.startTime)} – {pretty(s.endTime)}</div>
              {s.location && <div className="text-xs opacity-70">{s.location}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
