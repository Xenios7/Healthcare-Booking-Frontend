// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/api/auth/login";
const ME_PATH    = import.meta.env.VITE_ME_PATH || "/api/auth/me";
const PATIENT_REGISTER_PATH = import.meta.env.VITE_PATIENT_REGISTER_PATH || "/api/patients/register";
const DOCTOR_REGISTER_PATH  = import.meta.env.VITE_DOCTOR_REGISTER_PATH  || "/api/doctors/register";

async function handle(res) {
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  // Some endpoints may 204
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function login(email, password) {
  const res = await fetch(BASE + LOGIN_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

export async function me(token) {
  const res = await fetch(BASE + ME_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res);
}

export async function registerPatient(payload) {
  const res = await fetch(BASE + PATIENT_REGISTER_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function registerDoctor(payload) {
  const res = await fetch(BASE + DOCTOR_REGISTER_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}
