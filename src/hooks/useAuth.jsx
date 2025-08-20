// src/hooks/useAuth.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import * as api from "../services/api.js";

const AuthCtx = createContext(null);

function decodeRoleFromToken(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json);

    const raw =
      payload.role ??
      (Array.isArray(payload.roles) && payload.roles[0]) ??
      (Array.isArray(payload.authorities) && payload.authorities[0]) ??
      null;

    return raw ? String(raw).toUpperCase().replace(/^ROLE_/, "") : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Derive role from user (preferred) or from JWT
  const roleFromToken = useMemo(() => decodeRoleFromToken(token), [token]);
  const role = useMemo(
    () => user?.role ?? roleFromToken ?? null,
    [user?.role, roleFromToken]
  );

// Load user when token changes
useEffect(() => {
  let cancelled = false;

  const normalize = (v) =>
    v ? String(v).toUpperCase().replace(/^ROLE_/, "") : null;

  async function loadMe() {
    if (!token) {
      localStorage.removeItem("token");
      setUser(null);
      return;
    }
    localStorage.setItem("token", token);

    try {
      // api.me returns { user, roleDetected }
      const { user: u, roleDetected } = await api.me(token, roleFromToken);

      // Prefer role from token, then endpoint-detected, then payload field
      const r =
        normalize(roleFromToken) ||
        normalize(roleDetected) ||
        normalize(u?.role);

      const nextUser = r ? { ...u, role: r } : u;
      if (!cancelled) setUser(nextUser);
    } catch (e) {
      // 401 => invalid/expired token: log out
      if (e?.status === 401) {
        console.warn("Token invalid/expired; logging out.");
        setToken("");
        setUser(null);
        localStorage.removeItem("token");
        return;
      }

      // 403/404 => endpoint forbidden/missing: keep token,
      // derive minimal user info from JWT so routing by role still works
      if (e?.status === 403 || e?.status === 404) {
        try {
          const parts = String(token).split(".");
          const b64 = (parts[1] || "").replace(/-/g, "+").replace(/_/g, "/");
          const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
          const payload = parts[1] ? JSON.parse(atob(padded)) : {};

          const derivedRole =
            normalize(payload.role) ||
            normalize(Array.isArray(payload.roles) && payload.roles[0]) ||
            normalize(
              Array.isArray(payload.authorities) && payload.authorities[0]
            );

          if (!cancelled) {
            setUser({
              role: derivedRole,
              email: payload.sub || payload.email || null,
            });
          }
        } catch (err) {
          console.error("Could not decode JWT payload:", err);
        }
        return;
      }

      // Other errors -> just log
      console.error(e);
    }
  }

  loadMe();
  return () => {
    cancelled = true;
  };
}, [token, roleFromToken]);


  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.login(email, password); // expect { token, ...optional }
      const t = res?.token;
      if (!t) throw new Error("Missing token from server");
      setToken(t);

      const r =
        (res.role && String(res.role).replace(/^ROLE_/, "")) ||
        decodeRoleFromToken(t);

      return { ok: true, role: r || null, token: t };
    } catch (e) {
      console.error(e);
      setError(e?.message || "Login failed");
      return { ok: false, role: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  // Helper to check role in components (normalizes ROLE_ prefix)
  const is = useCallback(
    (r) => {
      const want = String(r || "").toUpperCase().replace(/^ROLE_/, "");
      const mine = String(role || "").toUpperCase().replace(/^ROLE_/, "");
      return !!want && mine === want;
    },
    [role]
  );

  const value = useMemo(
    () => ({
      token,
      setToken,
      user,
      setUser,
      role,
      is,
      login,
      logout,
      loading,
      error,
    }),
    [token, user, role, is, login, logout, loading, error]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
