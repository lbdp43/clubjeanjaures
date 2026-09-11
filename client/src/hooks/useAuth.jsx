import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../utils/api';
import { clearDataCache } from './useCachedFetch';

const AuthContext = createContext(null);
const USER_KEY = 'cjj-user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  // Si on connaît déjà l'utilisateur, on affiche l'app tout de suite et on vérifie en arrière-plan
  const [loading, setLoading] = useState(() => readStoredUser() === null);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data);
      storeUser(data);
    } catch {
      setUser(null);
      storeUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    storeUser(null);
    clearDataCache();
  }, []);

  // Valeur mémorisée : sinon chaque rendu du provider relance les effets de toutes les pages
  const value = useMemo(() => ({
    user,
    loading,
    logout,
    refreshUser: fetchUser,
    isAdmin: user?.role === 'admin',
    isMod: ['moderator', 'admin'].includes(user?.role),
    isMember: ['member', 'moderator', 'admin'].includes(user?.role)
  }), [user, loading, logout, fetchUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
}
