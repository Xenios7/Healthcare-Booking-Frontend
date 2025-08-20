// src/auth/roles.js

// Normalize things like "ROLE_ADMIN" -> "ADMIN"
export function normalizeRole(r) {
  return String(r || "").toUpperCase().replace(/^ROLE_/, "");
}

// Check if the current role (string or array) is among allowed (string or array)
export function hasRole(current, allowed) {
  const allowedArr = (Array.isArray(allowed) ? allowed : [allowed])
    .map(normalizeRole)
    .filter(Boolean);

  const currentArr = (Array.isArray(current) ? current : [current])
    .map(normalizeRole)
    .filter(Boolean);

  return currentArr.some(r => allowedArr.includes(r));
}
