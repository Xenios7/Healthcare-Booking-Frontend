// src/services/api.js
const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function http(path, { method = "GET", body, token, headers } = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const finalHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  if (res.status !== 204) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try { data = await res.json(); } catch {}
    } else {
      try { const t = await res.text(); data = t || null; } catch {}
    }
  }

  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function login(email, password) {
  return http("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// src/services/api.js
export async function me(token, roleHint) {
  const tryGet = async (path) => {
    try {
      const data = await http(path, { token });
      return { ok: true, data };
    } catch (e) {
      // Treat these as "not mine, try next"
      if ([401, 403, 404, 500].includes(e?.status)) return { ok: false, status: e.status };
      // Anything else (e.g., network) should still bubble up
      throw e;
    }
  };

  const norm = (v) => (v ? String(v).toUpperCase().replace(/^ROLE_/, "") : null);
  const hint = norm(roleHint);

  const byRole = {
    ADMIN: "/api/admins/me",
    DOCTOR: "/api/doctors/me",
    PATIENT: "/api/patients/me",
  };

  // Try the hinted role first if we have one, then the rest, then generic fallbacks
  const hinted = hint && byRole[hint] ? [byRole[hint]] : [];
  const candidates = [
    ...hinted,
    "/api/patients/me",
    "/api/doctors/me",
    "/api/admins/me",
    "/api/users/me",
    "/api/auth/me",
  ].filter(Boolean);

  const seen = new Set();
  for (const path of candidates) {
    if (seen.has(path)) continue;
    seen.add(path);

    const res = await tryGet(path);
    if (res.ok) {
      let roleDetected = null;
      if (path.includes("/patients/")) roleDetected = "PATIENT";
      else if (path.includes("/doctors/")) roleDetected = "DOCTOR";
      else if (path.includes("/admins/")) roleDetected = "ADMIN";
      return { user: res.data, roleDetected };
    }
  }

  const err = new Error("Forbidden");
  err.status = 403;
  throw err;
}
