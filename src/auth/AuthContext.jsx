// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api"; // uses login() + me(token, role)

const AuthContext = createContext(null);

// Normalize role: "ROLE_PATIENT" -> "PATIENT"
function normRole(v) {
  return v ? String(v).toUpperCase().replace(/^ROLE_/, "") : null;
}

// Decode role claim from JWT payload (no libs)
function roleFromToken(token) {
  try {
    const [, payloadB64] = String(token).split(".");
    if (!payloadB64) return null;
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);
    const raw =
      payload.role ??
      (Array.isArray(payload.roles) && payload.roles[0]) ??
      (Array.isArray(payload.authorities) && payload.authorities[0]) ??
      null;
    return normRole(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // single source of truth
  const [auth, setAuth] = useState(() => {
    // ignore any legacy "token" key; we only use "auth"
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : { token: null, role: null, user: null };
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth]);

  // Whenever we have a token, fetch /me for the **correct role**,
  // and keep the role from the token (DTO may not include it).
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!auth.token) return;

      const derivedRole = normRole(auth.role) || roleFromToken(auth.token);
      if (!derivedRole) return; // nothing to load yet

      try {
        const u = await api.me(auth.token, derivedRole); // returns user DTO
        const dto = u?.user ?? u;                  // <-- unwrap if { user, roleDetected }

        if (!cancelled) {
          setAuth(prev => ({
            token: prev.token,
            role: derivedRole,                     // keep role from JWT
            user: dto || null,                     // store just the DTO
          }));
        }
      } catch (e) {
        if (e?.status === 401) {
          // token bad/expired -> log out
          setAuth({ token: null, role: null, user: null });
          localStorage.removeItem("auth");
          return;
        }
        // 403/404 just means wrong endpoint for this role or not exposed; keep auth,
        // routing will still work because role is set from the JWT.
        // Other errors: show in console to debug backend issues.
        // console.error(e);
      }
    }

    loadMe();
    return () => { cancelled = true; };
  }, [auth.token, auth.role]);

  // Async login: call backend, keep token + role from JWT, user will be loaded by the effect above
  async function login(email, password) {
    setLoading(true); setError("");
    try {
      const { token } = await api.login(email, password);
      const r = roleFromToken(token);
      setAuth({ token, role: r, user: null });
      return { ok: true, role: r };
    } catch (e) {
      setError(e?.message || "Login failed");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuth({ token: null, role: null, user: null });
    localStorage.removeItem("auth");
  }

  const value = useMemo(
    () => ({
      ...auth,
      role: normRole(auth.role), // always normalized for consumers
      login,
      logout,
      loading,
      error,
    }),
    [auth, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
