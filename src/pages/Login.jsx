// src/pages/Login.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  function roleHome(r) {
    const norm = String(r || "").toUpperCase().replace(/^ROLE_/, "");
    switch (norm) {
      case "PATIENT":
        return "/patient";
      case "DOCTOR":
        return "/doctor";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, role } = await login(email, password);
    if (!ok) return;

    const target = (from === "/" || from === "/login") ? roleHome(role) : from;
    navigate(target, { replace: true });
  }

  return (
    <main className="container">
      <article style={{ maxWidth: 520, margin: "4rem auto" }}>
        <hgroup>
          <h1>Login</h1>
          <p>Sign in to manage your appointments</p>
        </hgroup>

        {error && (
          <mark style={{ display: "block", marginBottom: 12 }}>
            {String(error)}
          </mark>
        )}

        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <div className="grid">
            <button
              type="submit"
              className="contrast"
              aria-busy={loading}
              disabled={loading}
            >
              {loading ? "Logging in…" : "Login"}
            </button>
            <Link to="/" role="button" className="secondary">
              Cancel
            </Link>
          </div>
        </form>
      </article>
    </main>
  );
}
