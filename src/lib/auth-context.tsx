import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiGet, apiPostJson, setUnauthorizedHandler } from '@/lib/api-client';
import { clearAuth, getToken, getUser, setAuth as persistAuth } from '@/lib/storage';
import type { Role, User } from '@/lib/types';

type MeResponse = { ok: true; user: User; teams: unknown[] };
type LoginResponse = { ok: true; token: string; user: User };

type AuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSales: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth().then(() => setUser(null));
    });
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      // Hydrate from cache first for instant UI, then refresh from server.
      const cached = await getUser();
      if (cached) setUser(cached);

      try {
        const res = await apiGet<MeResponse>('me');
        setUser(res.user);
      } catch {
        // token invalid/expired — apiGet's 401 handler already cleared it
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPostJson<LoginResponse>('login', { email, password }, false);
    await persistAuth(res.token, res.user);
    setUser(res.user);
  }, []);

  const hasRole = useCallback((...roles: Role[]) => (user ? roles.includes(user.role) : false), [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAdmin: user ? user.role === 'admin' || user.role === 'human_resource' : false,
      isManager: user ? user.role === 'manager' : false,
      isSales: user ? user.role === 'sales' : false,
      login,
      logout,
      hasRole,
    }),
    [user, loading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
