import * as SecureStore from 'expo-secure-store';

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api').replace(/\/$/, '');
const TOKEN_KEY = 'learnpath_token'; // stored in Android Keystore / iOS Keychain via expo-secure-store

let token = null;
let onSessionExpired = () => {};

export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };
export async function loadToken() { token = await SecureStore.getItemAsync(TOKEN_KEY); return token; }
export async function saveToken(t) {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t); else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const qs = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No internet connection or the server is unreachable. Check your network and try again.', 0, 'NETWORK');
  } finally { clearTimeout(timer); }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error || {};
    const err = new ApiError(e.message || 'Something went wrong. Please try again.', res.status, e.code);
    if (res.status === 401 && ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_REVOKED'].includes(e.code)) onSessionExpired(err.message);
    throw err;
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
  tasks: (params) => request('/tasks', { params }),
  task: (id) => request(`/tasks/${id}`),
  createTask: (b) => request('/tasks', { method: 'POST', body: b }),
  updateTask: (id, b) => request(`/tasks/${id}`, { method: 'PUT', body: b }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
