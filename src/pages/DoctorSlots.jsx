// src/pages/DoctorSlots.jsx
// "My Slots" page for doctors: view, filter, edit and delete own appointment slots.
// Endpoints used:
//   GET  /api/doctors/me
//   GET  /api/appointmentSlots/by-doctor/{doctorId}           (all)
//   GET  /api/appointmentSlots/by-doctor/{doctorId}/available (available only)
//   PUT  /api/appointmentSlots/{id}
//   DELETE /api/appointmentSlots/{id}
// Security: Your router already wraps this with <RequireRole allowed={["DOCTOR"]} />

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

function toDateInput(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}
function toTimeInput(iso) {
  if (!iso) return "";
  return String(iso).slice(11, 16); // HH:mm
}
function toLdt(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}:00`;
}
function pretty(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return String(dt); }
}

export default function DoctorSlots() {
  const [me, setMe] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [slots, setSlots] = React.useState([]);

  // filters
  const [show, setShow] = React.useState("ALL"); // ALL | AVAILABLE | BOOKED
  const [futureOnly, setFutureOnly] = React.useState(true);

  // inline edit state
  const [editingId, setEditingId] = React.useState(null);
  const [editDate, setEditDate] = React.useState("");
  const [editStart, setEditStart] = React.useState("");
  const [editEnd, setEditEnd] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await api("/api/doctors/me");
        setMe(d);
        await loadSlots(d.id);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadSlots(doctorId) {
    setError("");
    setSuccess("");
    try {
      // get *all* then filter client-side so we can show BOOKED as well
      const list = await api(`/api/appointmentSlots/by-doctor/${doctorId}`);
      setSlots(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message || String(e)); }
  }

  const filtered = React.useMemo(() => {
    const now = new Date();
    return [...slots]
      .filter(s => {
        if (show === "AVAILABLE" && s.booked) return false;
        if (show === "BOOKED" && !s.booked) return false;
        if (futureOnly) {
          try { if (new Date(s.endTime) < now) return false; } catch {}
        }
        return true;
      })
      .sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
  }, [slots, show, futureOnly]);

  function beginEdit(s) {
    setEditingId(s.id);
    setEditDate(toDateInput(s.startTime));
    setEditStart(toTimeInput(s.startTime));
    setEditEnd(toTimeInput(s.endTime));
    setEditNotes(s.notes || "");
    setError("");
    setSuccess("");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDate("");
    setEditStart("");
    setEditEnd("");
    setEditNotes("");
  }

  async function saveEdit(id, booked) {
    if (!editDate || !editStart || !editEnd) {
      setError("Please fill date, start and end.");
      return;
    }
    // Service forbids changing a booked slot unless you set booked=false.
    if (booked) {
      setError("This slot is booked. You can't edit a booked slot here.");
      return;
    }
    try {
      const body = {
        startTime: toLdt(editDate, editStart),
        endTime: toLdt(editDate, editEnd),
        booked: false,
        notes: editNotes || null,
        // doctorId: me.id, // optional
      };
      await api(`/api/appointmentSlots/${id}`, { method: "PUT", body });
      setSuccess("Slot updated.");
      cancelEdit();
      await loadSlots(me.id);
    } catch (e) { setError(e.message || String(e)); }
  }

  async function removeSlot(id, booked) {
    if (booked) {
      setError("This slot is booked. You can't delete a booked slot here.");
      return;
    }
    if (!confirm("Delete this slot?")) return;
    try {
      await api(`/api/appointmentSlots/${id}`, { method: "DELETE" });
      setSuccess("Slot deleted.");
      await loadSlots(me.id);
    } catch (e) { setError(e.message || String(e)); }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">My Slots</h1>
      {loading && <p className="mt-2 text-gray-500">Loading…</p>}
      {error && <div className="mt-3 p-3 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}
      {success && <div className="mt-3 p-3 rounded bg-green-100 text-green-800 border border-green-200">{success}</div>}

      {me && (
        <div className="mt-3 text-sm text-gray-600">Doctor: <span className="font-medium">{me.fullName || me.name || me.email}</span> (ID: {me.id})</div>
      )}

      <section className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col">
          <span className="text-sm">Show</span>
          <select className="border rounded px-3 py-2" value={show} onChange={e=>setShow(e.target.value)}>
            <option value="ALL">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={futureOnly} onChange={e=>setFutureOnly(e.target.checked)} />
          <span className="text-sm">Future only</span>
        </label>
        <button className="px-3 py-2 rounded border" onClick={()=>loadSlots(me.id)}>Refresh</button>
      </section>

      <div className="mt-4 overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Booked</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t align-top">
                <td className="p-3 font-mono">{s.id}</td>
                <td className="p-3">
                  {editingId === s.id ? (
                    <div className="grid md:grid-cols-3 gap-2">
                      <input type="date" className="border rounded px-2 py-1" value={editDate} onChange={e=>setEditDate(e.target.value)} />
                      <input type="time" className="border rounded px-2 py-1" value={editStart} onChange={e=>setEditStart(e.target.value)} />
                      <input type="time" className="border rounded px-2 py-1" value={editEnd} onChange={e=>setEditEnd(e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <div>{pretty(s.startTime)} – {pretty(s.endTime)}</div>
                    </>
                  )}
                </td>
                <td className="p-3">{s.location || "—"}</td>
                <td className="p-3">{s.booked ? "Yes" : "No"}</td>
                <td className="p-3 w-64">
                  {editingId === s.id ? (
                    <textarea rows={2} className="border rounded w-full px-2 py-1" value={editNotes} onChange={e=>setEditNotes(e.target.value)} />
                  ) : (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{s.notes || "—"}</div>
                  )}
                </td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  {editingId === s.id ? (
                    <>
                      <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>saveEdit(s.id, s.booked)}>Save</button>
                      <button className="px-3 py-1 rounded border" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="px-3 py-1 rounded border" disabled={s.booked} onClick={()=>beginEdit(s)}>{s.booked ? "Edit (locked)" : "Edit"}</button>
                      <button className="px-3 py-1 rounded border" disabled={s.booked} onClick={()=>removeSlot(s.id, s.booked)}>{s.booked ? "Delete (locked)" : "Delete"}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>No slots to show</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Booked slots are locked here; cancel the related appointment to free them up, then edit or delete.
      </div>
    </div>
  );
}
