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
    const [, payloadB64] = String(token).split(".");
    if (!payloadB64) return null;
    const payload = JSON.parse(atob(payloadB64));
    // Accept a few common claim shapes
    const claim =
      payload.role ||
      (Array.isArray(payload.roles) && payload.roles[0]) ||
      (Array.isArray(payload.authorities) && payload.authorities[0]);
    return claim || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derive role from user (preferred) or from JWT
  const roleFromToken = useMemo(() => decodeRoleFromToken(token), [token]);
  const role = useMemo(() => user?.role ?? roleFromToken ?? null, [user?.role, roleFromToken]);

  // Load user when token changes
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
        const u = await api.me(token);
        if (!cancelled) setUser(u);
      } catch (e) {
        // Auto-logout on unauthorized/expired token
        if (e?.status === 401 || e?.status === 403) {
          console.warn("Token invalid/expired; logging out.");
          setToken("");
          setUser(null);
          localStorage.removeItem("token");
        } else {
          console.error(e);
        }
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.login(email, password); // expect at least { token }
      const t = res?.token;
      if (!t) throw new Error("Missing token");
      setToken(t);
      // Prefer role from response; otherwise decode from token
      const r = res.role || decodeRoleFromToken(t);
      return { ok: true, role: r };
    } catch (e) {
      console.error(e);
      setError(e?.message || "Login failed");
      return { ok: false };
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
o 