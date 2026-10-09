import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, setSessionExpiredHandler } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [notice, setNotice] = useState('');

  const clear = useCallback((message = '') => { setToken(null); setUser(null); setNotice(message); }, []);

  useEffect(() => { setSessionExpiredHandler((msg) => clear(msg)); }, [clear]);

  useEffect(() => {
    if (!getToken()) return;
    api.me().then((r) => setUser(r.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const authenticate = async (fn, payload) => {
    const { user: u, token } = await fn(payload);
    setToken(token); setUser(u); setNotice('');
  };

  const value = {
    user, loading, notice,
    login: (p) => authenticate(api.login, p),
    register: (p) => authenticate(api.register, p),
    logout: async () => { try { await api.logout(); } catch { /* token is dropped locally either way */ } clear(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
