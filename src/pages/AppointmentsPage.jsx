// Drop this file into: src/pages/AppointmentsPage.jsx (or any component folder)
// Tailwind optional but recommended. Works with plain CSS too.
// Assumes your JWT is stored in localStorage under key "token" after login.
// API base URL can be configured via VITE_API_BASE (defaults to http://localhost:8080)
import React from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (_) {
    return {};
  }
}

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
    // Try to parse error JSON else show text
    let message = text;
    try { message = JSON.parse(text)?.message || text; } catch (_) {}
    throw new Error(message || res.statusText);
  }
  try { return JSON.parse(text); } catch { return text; }
}

function useAuthInfo() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const payload = token ? decodeJwt(token) : {};
  // Common JWT claims: roles, role, authorities, scope
  let roles = [];
  if (Array.isArray(payload.roles)) roles = payload.roles;
  else if (Array.isArray(payload.authorities)) roles = payload.authorities.map(String);
  else if (typeof payload.role === "string") roles = [payload.role];
  // Normalize to simple role names without "ROLE_" prefix
  roles = roles.map(r => r.replace(/^ROLE_/, ""));
  const primaryRole = roles.includes("ADMIN") ? "ADMIN" : roles.includes("DOCTOR") ? "DOCTOR" : roles.includes("PATIENT") ? "PATIENT" : null;
  return { token, roles, primaryRole, payload };
}

function cn(...classes) { return classes.filter(Boolean).join(" "); }

function slotLabel(start, end) {
  if (!start || !end) return "—";
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return `${start} - ${end}`;
  const day = s.getDate();
  const month = s.toLocaleString(undefined, { month: "short" }); // Jan, Feb, ...
  const year = s.getFullYear();
  const hm = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${day} ${month} ${year}, ${hm(s)} - ${hm(e)}`;
}

function prettyDate(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const day = d.getDate();
    const month = d.toLocaleString(undefined, { month: "short" });
    const year = d.getFullYear();
    const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${day} ${month} ${year}, ${hm}`;
  } catch { return String(dt); }
}




async function fetchCurrentActor(primaryRole) {
  if (primaryRole === "PATIENT") return await api("/api/patients/me");
  if (primaryRole === "DOCTOR") return await api("/api/doctors/me");
  return null; // ADMIN or unknown
}

async function fetchAppointmentsFor(primaryRole, actor) {
  if (primaryRole === "PATIENT" && actor?.id) return await api(`/api/appointments/by-patient/${actor.id}`);
  if (primaryRole === "DOCTOR" && actor?.id) return await api(`/api/appointments/by-doctor/${actor.id}`);
  // Admin default: show by status PENDING for a lighter first load (change as you like)
  return await api(`/api/appointments/by-status/PENDING`).catch(() => []);
}

async function fetchAppointmentsByDoctorAndStatus(doctorId, status) {
  return await api(`/api/appointments/by-doctor/${doctorId}/status/${status}`);
}

async function fetchAvailableSlotsForDoctor(doctorId) {
    const list = await api(`/api/appointmentSlots/by-doctor/${doctorId}/available`).catch(() => []);
    return Array.isArray(list) ? list : [];
 }

async function searchDoctorsBySpeciality(speciality) {
  return await api(`/api/doctors/speciality/${encodeURIComponent(speciality)}`);
}

async function getDoctorById(doctorId) {
  return await api(`/api/doctors/${doctorId}`);
}

async function createAppointment({ slotId, patientId, doctorId, notes }) {
  const body = {
    slotId: Number(slotId),
    patientId: Number(patientId),
    doctorId: Number(doctorId),
  };
  if (notes && notes.trim()) body.notes = notes.trim();

  return await api(`/api/appointments`, { method: "POST", body });
}


async function updateAppointmentStatus(appointmentId, status) {
  // send status as query param instead of JSON body
  const qs = encodeURIComponent(status);
  return await api(`/api/appointments/${appointmentId}?status=${qs}`, {
    method: "PUT",
  });
}


async function deleteAppointment(appointmentId) {
  return await api(`/api/appointments/${appointmentId}`, { method: "DELETE" });
}

export default function AppointmentsPage() {
  const { primaryRole } = useAuthInfo();
  const [loading, setLoading] = React.useState(true);
  const [actor, setActor] = React.useState(null); // me (patient/doctor)
  const [appointments, setAppointments] = React.useState([]);
  const [error, setError] = React.useState("");

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [doctorFilter, setDoctorFilter] = React.useState("");

  // Booking state (patient)
  const [speciality, setSpeciality] = React.useState("");
  const [doctorOptions, setDoctorOptions] = React.useState([]);
  const [selectedDoctor, setSelectedDoctor] = React.useState(null);
  const [availableSlots, setAvailableSlots] = React.useState([]);
  const [selectedSlotId, setSelectedSlotId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await fetchCurrentActor(primaryRole);
        setActor(me);
        const appts = await fetchAppointmentsFor(primaryRole, me);
        setAppointments(Array.isArray(appts) ? appts : []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryRole]);

  const filteredAppointments = React.useMemo(() => {
    let list = [...appointments];
    if (statusFilter !== "ALL") list = list.filter(a => (a?.status || "").toUpperCase() === statusFilter);
    if (doctorFilter && primaryRole !== "DOCTOR") {
      list = list.filter(a => String(a?.doctor?.id || a?.doctorId || "").includes(doctorFilter.trim()));
    }
    return list;
  }, [appointments, statusFilter, doctorFilter, primaryRole]);

  async function refreshAppointments() {
    try {
      setLoading(true);
      const appts = await fetchAppointmentsFor(primaryRole, actor);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (e) { setError(e.message || String(e)); }
    finally { setLoading(false); }
  }

  async function handleDoctorSearchBySpeciality(e) {
    e.preventDefault();
    setError("");
    try {
      setDoctorOptions([]);
      const list = await searchDoctorsBySpeciality(speciality);
      setDoctorOptions(Array.isArray(list) ? list : [list].filter(Boolean));
    } catch (e2) {
      setError(e2.message || String(e2));
    }
  }

  async function handlePickDoctor(doctor) {
    setSelectedDoctor(doctor);
    setAvailableSlots([]);
    setSelectedSlotId("");
    setError("");
    try {
      const slots = await fetchAvailableSlotsForDoctor(doctor?.id || doctor?.doctorId || doctor);
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (e) { setError(e.message || String(e)); }
  }

async function handleBook() {
  if (!selectedSlotId) return setError("Please select a time slot first.");
  if (!actor?.id) return setError("Could not resolve your patient ID.");
  if (!selectedDoctor?.id) return setError("Please pick a doctor first.");

  setError("");
  try {
    await createAppointment({
      slotId: selectedSlotId,
      patientId: actor.id,
      doctorId: selectedDoctor.id,
      notes,
    });
    setNotes("");
    setSelectedSlotId("");
    await refreshAppointments();
    alert("Appointment booked!");
  } catch (e) {
    setError(e.message || String(e));
  }
}

async function handleApprove(apptId) {
  try {
    await updateAppointmentStatus(apptId, "APPROVED");   // <-- not CONFIRMED
    await refreshAppointments();
  } catch (e) { setError(e.message || String(e)); }
}

async function handleReject(apptId) {
  try {
    await updateAppointmentStatus(apptId, "REJECTED");
    await refreshAppointments();
  } catch (e) { setError(e.message || String(e)); }
}


  async function handleCancel(apptId) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await deleteAppointment(apptId);
      await refreshAppointments();
    } catch (e) { setError(e.message || String(e)); }
  }

  async function handleAdminFilter() {
    if (!doctorFilter || statusFilter === "ALL") return; // need both for the admin optimized path
    try {
      setLoading(true);
      const list = await fetchAppointmentsByDoctorAndStatus(doctorFilter, statusFilter);
      setAppointments(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message || String(e)); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="text-sm opacity-70">Role: <strong>{primaryRole || "Guest"}</strong>{actor?.fullName ? ` • ${actor.fullName}` : ""}</div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>
      )}

      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col">
            <span className="text-sm">Status</span>
            <select className="border rounded px-3 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {['ALL','PENDING','APPROVED','REJECTED','CANCELLED'].map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
              </select>
          </label>
          {primaryRole !== 'DOCTOR' && (
            <label className="flex flex-col">
              <span className="text-sm">Doctor ID (filter)</span>
              <input className="border rounded px-3 py-2" placeholder="e.g., 7" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} />
            </label>
          )}
          <button className="px-4 py-2 rounded bg-black text-white" onClick={refreshAppointments} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          {primaryRole === 'ADMIN' && (
            <button className="px-4 py-2 rounded border" onClick={handleAdminFilter}>Fetch by Doctor & Status</button>
          )}
        </div>

        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Patient</th>
                <th className="text-left p-3">Doctor</th>
                <th className="text-left p-3">Slot</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-mono">{a.id}</td>
                  <td className="p-3">{a?.patient?.fullName || a?.patientName || a?.patient?.email || a?.patientId || '—'}</td>
                  <td className="p-3">{a?.doctor?.fullName || a?.doctorName || a?.doctor?.email || a?.doctorId || '—'}</td>
                  <td className="p-3">
                    {a?.slot ? (
                      <div className="space-y-0.5">
                        <div>{slotLabel(a.slot.startTime, a.slot.endTime)}</div>
                        {a.slot?.location && <div className="text-xs opacity-70">{a.slot.location}</div>}
                      </div>
                    ) : a?.slotId ? `Slot #${a.slotId}` : '—'}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                    "px-2 py-1 rounded text-xs font-semibold",
                    a.status === 'APPROVED'  && 'bg-green-100 text-green-700',
                    a.status === 'PENDING'   && 'bg-yellow-100 text-yellow-800',
                    a.status === 'REJECTED'  && 'bg-red-100 text-red-700',
                    a.status === 'CANCELLED' && 'bg-gray-200 text-gray-700'
                    )}>
                    {a.status}
                    </span>
                  </td>
                  <td className="p-3">{prettyDate(a.createdAt || a.created || a.created_on)}</td>
                  <td className="p-3 space-x-2">
                    {primaryRole === 'DOCTOR' && a.status === 'PENDING' && (
                      <>
                        <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => handleApprove(a.id)}>Approve</button>
                        <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => handleReject(a.id)}>Reject</button>
                      </>
                    )}
                    {primaryRole === 'PATIENT' && (a.status === 'PENDING' || a.status === 'APPROVED') && (
                      <button className="px-3 py-1 rounded border" onClick={() => handleCancel(a.id)}>Cancel</button>
                    )}
                    {primaryRole === 'ADMIN' && (
                      <button className="px-3 py-1 rounded border" onClick={() => handleCancel(a.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr><td className="p-6 text-center text-gray-500" colSpan={7}>No appointments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {primaryRole === 'PATIENT' && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Book a new appointment</h2>
          <p className="text-sm text-gray-600 mt-1">Find a doctor by speciality, pick an available slot, and confirm.</p>

          <form className="mt-4 flex flex-wrap gap-3 items-end" onSubmit={handleDoctorSearchBySpeciality}>
            <label className="flex flex-col">
              <span className="text-sm">Speciality</span>
              <input className="border rounded px-3 py-2" placeholder="e.g., cardiology" value={speciality} onChange={e => setSpeciality(e.target.value)} />
            </label>
            <button type="submit" className="px-4 py-2 rounded bg-black text-white">Search Doctors</button>
            <div className="text-xs text-gray-500">or paste Doctor ID:&nbsp;
              <input className="border rounded px-2 py-1" placeholder="ID" onBlur={async (e) => {
                const id = e.target.value.trim();
                if (!id) return;
                try { const d = await getDoctorById(id); await handlePickDoctor(d); }
                catch (err) { setError(err.message || String(err)); }
              }}/>
            </div>
          </form>

          {doctorOptions.length > 0 && (
            <div className="mt-4 p-3 border rounded">
              <div className="font-medium mb-2">Pick a doctor</div>
              <div className="grid md:grid-cols-2 gap-2">
                {doctorOptions.map(d => (
                  <button key={d.id} type="button" className={cn("text-left p-3 border rounded hover:bg-gray-50", selectedDoctor?.id===d.id && 'ring-2 ring-black')} onClick={() => handlePickDoctor(d)}>
                    <div className="font-semibold">{d.fullName || d.name || d.email}</div>
                    <div className="text-xs text-gray-600">ID: {d.id} {d.speciality ? `• ${d.speciality}` : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDoctor && (
            <div className="mt-4 p-3 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Available slots for {selectedDoctor.fullName || selectedDoctor.name || `Doctor #${selectedDoctor.id}`}</div>
                  <div className="text-xs text-gray-600">Doctor ID: {selectedDoctor.id}</div>
                </div>
                <button className="px-3 py-1 rounded border" onClick={() => handlePickDoctor(selectedDoctor)}>Refresh</button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {availableSlots.map(s => (
                  <label key={s.id} className={cn("p-3 border rounded cursor-pointer", selectedSlotId===String(s.id) && 'ring-2 ring-black')}>
                    <input type="radio" name="slot" className="mr-2" value={s.id} checked={selectedSlotId===String(s.id)} onChange={() => setSelectedSlotId(String(s.id))} />
                    <span className="font-medium">{slotLabel(s.startTime, s.endTime)}</span>                    {s.location && <div className="text-xs text-gray-600">{s.location}</div>}
                  </label>
                ))}
                {availableSlots.length === 0 && <div className="text-sm text-gray-500">No free slots.</div>}
              </div>

              <div className="mt-3 flex items-end gap-2">
                <label className="flex-1 flex flex-col">
                  <span className="text-sm">Notes (optional)</span>
                  <textarea className="border rounded px-3 py-2" rows={2} placeholder="Reason for visit, symptoms, etc." value={notes} onChange={e => setNotes(e.target.value)} />
                </label>
                <button className="px-4 py-2 rounded bg-black text-white" onClick={handleBook} disabled={!selectedSlotId}>Book</button>
              </div>
            </div>
          )}
        </section>
      )}


      {primaryRole === 'ADMIN' && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Admin actions</h2>
          <p className="text-sm text-gray-600 mt-1">Use the filters above to narrow by status and doctor. You can delete any appointment.</p>
        </section>
      )}
    </div>
  );
}
