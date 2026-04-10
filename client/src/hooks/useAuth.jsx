import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = () => fetchUser();

  const value = { user, loading, logout, refreshUser, isAdmin: user?.role === 'admin', isMod: ['moderator', 'admin'].includes(user?.role), isMember: ['member', 'moderator', 'admin'].includes(user?.role) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
}
