// src/pages/MyProfile.jsx
// Patient My Profile page wired to your backend contracts:
//   GET  /api/patients/me           -> load current patient (shows first/last/email as READ-ONLY)
//   PUT  /api/patients/me           -> update via PatientProfileUpdateDTO {dateOfBirth, bloodType, allergies, insuranceId}
// Notes:
// - We DO NOT edit firstName/lastName/email here (shown read-only as you requested).
// - "dateOfBirth" expects a LocalDate (YYYY-MM-DD). We keep it as a plain string; no timezone math.
// - "allergies" is a plain string in your model (TEXT). Use any format you like.
// - "insuranceId" is a single string.

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

function normalizeDateInput(v) {
  // Accept: undefined, "YYYY-MM-DD", or an ISO string and coerce to YYYY-MM-DD for <input type="date">
  if (!v) return "";
  if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);
  try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
}

export default function MyProfile() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Original server object for diffing and display
  const [original, setOriginal] = React.useState(null);

  // Read-only account identity (from User base class)
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Editable PatientProfileUpdateDTO fields
  const [dateOfBirth, setDateOfBirth] = React.useState(""); // YYYY-MM-DD
  const [bloodType, setBloodType] = React.useState("");
  const [allergies, setAllergies] = React.useState("");
  const [insuranceId, setInsuranceId] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const me = await api("/api/patients/me");
        setOriginal(me);
        setFirstName(me.firstName || "");
        setLastName(me.lastName || "");
        setEmail(me.email || "");
        setDateOfBirth(normalizeDateInput(me.dateOfBirth));
        setBloodType(me.bloodType || "");
        setAllergies(me.allergies || "");
        setInsuranceId(me.insuranceId || "");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function hasChanges() {
    if (!original) return false;
    const eq = (a, b) => String(a ?? "") === String(b ?? "");
    return !(
      eq(normalizeDateInput(original.dateOfBirth), dateOfBirth) &&
      eq(original.bloodType, bloodType) &&
      eq(original.allergies, allergies) &&
      eq(original.insuranceId, insuranceId)
    );
  }

  async function onSave(e) {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        dateOfBirth: dateOfBirth || null,
        bloodType: bloodType || null,
        allergies: allergies ?? "",
        insuranceId: insuranceId || null,
      };
      const updated = await api("/api/patients/me", { method: "PUT", body: payload });
      setOriginal(updated);
      // Re-sync UI with server response
      setDateOfBirth(normalizeDateInput(updated.dateOfBirth));
      setBloodType(updated.bloodType || "");
      setAllergies(updated.allergies || "");
      setInsuranceId(updated.insuranceId || "");
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    if (!original) return;
    setDateOfBirth(normalizeDateInput(original.dateOfBirth));
    setBloodType(original.bloodType || "");
    setAllergies(original.allergies || "");
    setInsuranceId(original.insuranceId || "");
    setError("");
    setSuccess("");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {loading && <p className="mt-4 text-gray-500">Loading…</p>}
      {error && (
        <div className="mt-4 p-3 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>
      )}
      {success && (
        <div className="mt-4 p-3 rounded bg-green-100 text-green-800 border border-green-200">{success}</div>
      )}

      {!loading && original && (
        <>
          {/* Identity (read-only) */}
          <section className="mt-6 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-3">Account</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="flex flex-col">
                <span className="text-sm">First name</span>
                <input className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" value={firstName} readOnly />
              </label>
              <label className="flex flex-col">
                <span className="text-sm">Last name</span>
                <input className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" value={lastName} readOnly />
              </label>
              <label className="flex flex-col">
                <span className="text-sm">Email</span>
                <input type="email" className="border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" value={email} readOnly />
              </label>
            </div>
          </section>

          {/* Medical / insurance (editable) */}
          <form className="mt-6 p-4 border rounded space-y-4" onSubmit={onSave}>
            <h2 className="text-xl font-semibold">Medical & Insurance</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="flex flex-col">
                <span className="text-sm">Date of birth</span>
                <input type="date" className="border rounded px-3 py-2" value={dateOfBirth} onChange={e=>setDateOfBirth(e.target.value)} />
              </label>
              <label className="flex flex-col">
                <span className="text-sm">Blood type</span>
                <select className="border rounded px-3 py-2" value={bloodType} onChange={e=>setBloodType(e.target.value)}>
                  <option value="">—</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <label className="flex flex-col">
                <span className="text-sm">Insurance ID</span>
                <input className="border rounded px-3 py-2" value={insuranceId} onChange={e=>setInsuranceId(e.target.value)} />
              </label>
            </div>

            <label className="flex flex-col">
              <span className="text-sm">Allergies</span>
              <textarea rows={3} className="border rounded px-3 py-2" placeholder="e.g., penicillin; peanuts" value={allergies} onChange={e=>setAllergies(e.target.value)} />
            </label>


            <div className="flex gap-2">
              <button type="submit" disabled={saving || !hasChanges()} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={onReset} className="px-4 py-2 rounded border">Reset</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
