import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, loadToken, saveToken, setSessionExpiredHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState('');

  const clear = useCallback(async (message = '') => { await saveToken(null); setUser(null); setNotice(message); }, []);
  useEffect(() => { setSessionExpiredHandler((m) => clear(m)); }, [clear]);

  useEffect(() => {
    (async () => {
      try {
        if (await loadToken()) setUser((await api.me()).user);
      } catch (e) {
        if (e.code === 'NETWORK') setNotice(e.message); // keep token, let the user retry by logging in
      } finally { setBooting(false); }
    })();
  }, []);

  const authenticate = async (fn, payload) => {
    const { user: u, token } = await fn(payload);
    await saveToken(token); setUser(u); setNotice('');
  };

  return (
    <AuthContext.Provider value={{
      user, booting, notice,
      login: (p) => authenticate(api.login, p),
      register: (p) => authenticate(api.register, p),
      logout: async () => { try { await api.logout(); } catch { /* ignore */ } await clear(); },
    }}>{children}</AuthContext.Provider>
  );
}
