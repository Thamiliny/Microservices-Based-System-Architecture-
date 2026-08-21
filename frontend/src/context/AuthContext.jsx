import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

/** Holds the signed-in user and exposes login / register / logout actions. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first paint when a token is still in localStorage.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }

    api.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: nextUser, token } = await api.login(credentials);
    tokenStore.set(token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: nextUser, token } = await api.register(payload);
    tokenStore.set(token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
