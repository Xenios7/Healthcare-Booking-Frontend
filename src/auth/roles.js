// robust normalization + membership helpers
export const normalizeRole = (r) =>
  r ? String(r).toUpperCase().trim().replace(/^ROLE_/, "") : null;

export const hasRole = (role, allowed) => {
  const mine = normalizeRole(role);
  if (!mine) return false;
  const allow = (Array.isArray(allowed) ? allowed : [allowed]).map(normalizeRole);
  return allow.includes(mine);
};
