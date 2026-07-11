// MaintainIQ Backend API Service
// Wraps all backend calls with JWT token injection and graceful offline fallback

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// ─── Token helpers ──────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("maintainiq_jwt");
export const setToken = (token) =>
  localStorage.setItem("maintainiq_jwt", token);
export const clearToken = () => localStorage.removeItem("maintainiq_jwt");

// ─── Core fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `API error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// ─── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  /**
   * Register a new user account.
   * On success stores the JWT and returns the user object.
   */
  async register(name, email, password, role) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
    if (data.token) setToken(data.token);
    return data; // { success, token, user }
  },

  /**
   * Log in with email + password.
   * On success stores the JWT and returns the user object.
   */
  async login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    return data; // { success, token, user }
  },

  /** Get the current authenticated user's profile */
  async getProfile() {
    return apiFetch("/auth/profile");
  },

  /** Log out (clears token from localStorage) */
  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  },

  /**
   * Request a password reset PIN for the given email.
   * Backend returns the PIN in development mode so the frontend can show it.
   */
  async forgotPassword(email) {
    return apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password using the PIN received from forgotPassword.
   */
  async resetPassword(email, pin, newPassword) {
    return apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, pin, newPassword }),
    });
  },
};

// ─── Assets API ─────────────────────────────────────────────────────────────
export const assetsAPI = {
  getAll: () => apiFetch("/assets"),
  getByCode: (code) => apiFetch(`/assets/code/${code}`),
  create: (data) =>
    apiFetch("/assets", { method: "POST", body: JSON.stringify(data) }),
  update: (code, data) =>
    apiFetch(`/assets/${code}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (code) => apiFetch(`/assets/${code}`, { method: "DELETE" }),
};

// ─── Issues API ─────────────────────────────────────────────────────────────
export const issuesAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/issues${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiFetch(`/issues/${id}`),
  create: (data) =>
    apiFetch("/issues", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/issues/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Technicians API ─────────────────────────────────────────────────────────
export const techniciansAPI = {
  getAll: () => apiFetch("/technicians"),
};

// ─── History API ─────────────────────────────────────────────────────────────
export const historyAPI = {
  getAll: () => apiFetch("/history"),
  getForAsset: (assetCode) => apiFetch(`/history/${assetCode}`),
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsAPI = {
  get: () => apiFetch("/settings"),
  update: (data) =>
    apiFetch("/settings", { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Connectivity check ─────────────────────────────────────────────────────
/**
 * Returns true if the backend is reachable.
 * Used by Auth.jsx to decide whether to use real API or localStorage fallback.
 */
export async function isBackendOnline() {
  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
