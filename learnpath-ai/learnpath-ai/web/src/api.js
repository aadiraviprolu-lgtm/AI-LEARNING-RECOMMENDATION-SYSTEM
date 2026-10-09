const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'learnpath_token';

let token = localStorage.getItem(TOKEN_KEY);
let onSessionExpired = () => {};

export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };
export const getToken = () => token;
export const setToken = (t) => {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v); });
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ''}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your internet connection and try again.', 0, 'NETWORK');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error || {};
    const apiErr = new ApiError(err.message || 'Something went wrong. Please try again.', res.status, err.code, err.details);
    if (res.status === 401 && ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_REVOKED'].includes(err.code)) {
      onSessionExpired(apiErr.message);
    }
    throw apiErr;
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  recommendations: () => request('/recommendations'),
  projects: (params) => request('/projects', { params }),
  project: (id) => request(`/projects/${id}`),
  createProject: (b) => request('/projects', { method: 'POST', body: b }),
  updateProject: (id, b) => request(`/projects/${id}`, { method: 'PUT', body: b }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  tasks: (params) => request('/tasks', { params }),
  createTask: (b) => request('/tasks', { method: 'POST', body: b }),
  updateTask: (id, b) => request(`/tasks/${id}`, { method: 'PUT', body: b }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
