// src/services/api.js
// BASE comes from VITE_API_BASE_URL (set it to your Koyeb API URL in .env / .env.production).
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "";

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

async function http(path, { method = "GET", body, token, headers } = {}) {
  const url = buildUrl(path);
  const finalHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {})
  };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  if (res.status !== 204) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try { data = await res.json(); } catch {}
    } else {
      try { data = await res.text(); data = data || null; } catch {}
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

// ---- Auth ----
export function login(email, password) {
  return http("/api/auth/login", { method: "POST", body: { email, password } });
}

// ---- Current user (role-aware probe) ----
export async function me(token, roleHint) {
  const tryGet = async (path) => {
    try { return { ok: true, data: await http(path, { token }) }; }
    catch (e) { if ([401, 403, 404, 500].includes(e?.status)) return { ok: false, status: e.status }; throw e; }
  };
  const norm = (v) => (v ? String(v).toUpperCase().replace(/^ROLE_/, "") : null);
  const hint = norm(roleHint);
  const byRole = { ADMIN: "/api/admins/me", DOCTOR: "/api/doctors/me", PATIENT: "/api/patients/me" };
  const hinted = hint && byRole[hint] ? [byRole[hint]] : [];
  const candidates = [...hinted, "/api/patients/me", "/api/doctors/me", "/api/admins/me", "/api/users/me", "/api/auth/me"];
  const seen = new Set();
  for (const path of candidates) {
    if (seen.has(path)) continue; seen.add(path);
    const res = await tryGet(path);
    if (res.ok) {
      let roleDetected = null;
      if (path.includes("/patients/")) roleDetected = "PATIENT";
      else if (path.includes("/doctors/")) roleDetected = "DOCTOR";
      else if (path.includes("/admins/")) roleDetected = "ADMIN";
      return { user: res.data, roleDetected };
    }
  }
  const err = new Error("Forbidden"); err.status = 403; throw err;
}

// ---- Patients ----
export const getMyPatient = (token) => http("/api/patients/me", { token });
export const updateMyPatient = (dto, token) => http("/api/patients/me", { method: "PUT", body: dto, token });

// ---- Doctors ----
export function searchDoctorsBySpeciality(speciality, token) {
  const spec = String(speciality || "").trim();
  if (!spec) return Promise.resolve([]);
  return http(`/api/doctors/speciality/${encodeURIComponent(spec)}`, { token });
}
export function getDoctorById(id, token) {
  return http(`/api/doctors/${encodeURIComponent(id)}`, { token });
}
export const listDoctors = searchDoctorsBySpeciality;

// ---- Generic helpers (optional) ----
export const api = {
  get: (path, token, headers) => http(path, { method: "GET", token, headers }),
  post: (path, body, token, headers) => http(path, { method: "POST", body, token, headers }),
  put: (path, body, token, headers) => http(path, { method: "PUT", body, token, headers }),
  patch: (path, body, token, headers) => http(path, { method: "PATCH", body, token, headers }),
  del: (path, token, headers) => http(path, { method: "DELETE", token, headers })
};
