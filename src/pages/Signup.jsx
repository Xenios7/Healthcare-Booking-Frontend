import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const API = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export default function Signup() {
  const [role, setRole] = useState("PATIENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const nav = useNavigate();
  const { login } = useAuth();

  const passwordMismatch = password && confirm && password !== confirm;
  const canSubmitPatient =
    !!firstName && !!lastName && !!email && !!password && !passwordMismatch;

  async function handleSubmit(e) {
    e.preventDefault();
    if (role === "DOCTOR") return;

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: "PATIENT",
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Sign up failed");
      await login(email, password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  // Shared label style to prevent vertical letter wrapping
  const labelStyle = { wordBreak: "normal", whiteSpace: "normal" };

  return (
    <section>
      <h1 className="text-3xl font-bold mb-2">Create your account</h1>
      <p className="opacity-80 mb-6">Choose your role to see the right fields.</p>

      <article
        className="p-6 rounded-lg border border-slate-800 bg-slate-900/40"
        style={{ maxWidth: 880, marginInline: "auto" }}
      >
        {/* Toggle */}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`h-10 px-4 rounded-md border ${
              role === "PATIENT"
                ? "bg-sky-600 text-white border-sky-600"
                : "border-slate-700 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("DOCTOR")}
            className={`h-10 px-4 rounded-md border ${
              role === "DOCTOR"
                ? "bg-sky-600 text-white border-sky-600"
                : "border-slate-700 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {role === "PATIENT" ? (
            <>
              {/* Responsive grid with a *minimum* column width so it wraps nicely */}
              <div
                className="grid"
                style={{
                  gap: "1rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    First name *
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Jane"
                      type="text"
                    />
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>
                    Last name *
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Doe"
                      type="text"
                    />
                  </label>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Email *
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      type="email"
                    />
                  </label>
                </div>

                <div>
                  <label style={labelStyle}>
                    Password *
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      type="password"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>
                    Confirm password *
                    <input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      type="password"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </label>
                  {passwordMismatch && (
                    <small className="text-red-500">Passwords do not match.</small>
                  )}
                </div>
              </div>

              <p className="opacity-70 mt-3">
                Doctor accounts may require admin approval.
              </p>
            </>
          ) : (
            <div className="rounded-md p-4 bg-slate-800/40 border border-slate-800 mb-4">
              <strong>Doctor accounts</strong>
              <p className="mt-2 opacity-80">
                Doctor accounts are created by an administrator. Please contact your clinic’s
                admin to be added. You can still <a href="/login">log in</a> if you already
                have credentials.
              </p>
            </div>
          )}

          {error && <div className="mt-4 text-red-400">{error}</div>}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="h-10 px-4 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={() => nav(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || role === "DOCTOR" || !canSubmitPatient}
              className="h-10 px-5 rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
