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

// ---- helpers ---------------------------------------------------------------

function normalizeRole(v) {
  return v ? String(v).toUpperCase().replace(/^ROLE_/, "") : null;
}

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

    return normalizeRole(raw);
  } catch {
    return null;
  }
}

// ---- provider --------------------------------------------------------------

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // used by login()
  const [error, setError] = useState("");

  // Derive role primarily from user, otherwise from JWT
  const roleFromToken = useMemo(() => decodeRoleFromToken(token), [token]);
  const role = useMemo(
    () => user?.role ?? roleFromToken ?? null,
    [user?.role, roleFromToken]
  );

  // Load user whenever the token changes
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!token) {
        localStorage.removeItem("token");
        setUser(null);
        return;
      }

      localStorage.setItem("token", token);

      try {
        // api.me returns the user DTO (not { user, roleDetected })
        const u = await api.me(token, roleFromToken);

        // Prefer role from JWT; if backend also returns a role field, normalize it
        const finalRole =
          normalizeRole(roleFromToken) || normalizeRole(u?.role) || null;

        if (!cancelled) setUser(finalRole ? { ...u, role: finalRole } : u);
      } catch (e) {
        // Unauthorized/expired token -> logout
        if (e?.status === 401) {
          console.warn("Token invalid/expired; logging out.");
          setToken("");
          setUser(null);
          localStorage.removeItem("token");
          return;
        }

        // Forbidden/missing endpoint -> keep token and derive minimal identity from JWT
        if (e?.status === 403 || e?.status === 404) {
          try {
            const parts = String(token).split(".");
            const b64 = (parts[1] || "").replace(/-/g, "+").replace(/_/g, "/");
            const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
            const payload = parts[1] ? JSON.parse(atob(padded)) : {};

            const derivedRole =
              normalizeRole(payload.role) ||
              normalizeRole(Array.isArray(payload.roles) && payload.roles[0]) ||
              normalizeRole(
                Array.isArray(payload.authorities) && payload.authorities[0]
              ) ||
              null;

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

        // Other errors: just log
        console.error(e);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token, roleFromToken]);

  // ---- auth API ------------------------------------------------------------

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.login(email, password); // expects { token }
      const t = res?.token;
      if (!t) throw new Error("Missing token from server");
      setToken(t);

      const r = decodeRoleFromToken(t);
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

  const is = useCallback(
    (r) => {
      const want = normalizeRole(r);
      const mine = normalizeRole(role);
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

// ---- hook ------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
