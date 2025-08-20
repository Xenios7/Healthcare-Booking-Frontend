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

// Try specific endpoints and return both user and detected role
export async function me(token, roleHint) {
  const norm = (s) => String(s || "").toUpperCase().replace(/^ROLE_/, "");
  const hint = norm(roleHint);

  const tryGet = async (path, roleDetected) => {
    const user = await http(path, { token });
    return { user, roleDetected };
  };

  const order = [];
  if (hint === "PATIENT") order.push(["/api/patients/me", "PATIENT"]);
  if (hint === "DOCTOR")  order.push(["/api/doctors/me",  "DOCTOR"]);
  if (hint === "ADMIN")   order.push(["/api/admins/me",   "ADMIN"], ["/api/users/me", "ADMIN"]);

  if (!order.length) {
    // No hint: try both common ones
    order.push(
      ["/api/patients/me", "PATIENT"],
      ["/api/doctors/me",  "DOCTOR"],
      ["/api/users/me",    null]      // fallback, if you have it
    );
  }

  let lastErr;
  for (const [path, roleDetected] of order) {
    try {
      return await tryGet(path, roleDetected);
    } catch (e) {
      lastErr = e;
      if (![401, 403, 404].includes(e?.status)) throw e;
    }
  }
  throw lastErr || new Error("Unable to load current user");
}
