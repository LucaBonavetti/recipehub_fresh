import React from 'react';
import { apiFetch } from '../api';

export type User = { id: string; email: string; displayName: string } | null;

type Ctx = {
  user: User;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = React.createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    try {
      const r = await apiFetch('/api/auth/me');
      if (r.status === 401) {
        setUser(null);
        return;
      }
      if (!r.ok) throw new Error(`me failed (${r.status})`);
      const j = await r.json();
      setUser(j.user ?? null);
    } catch (e: any) {
      setError(e?.message || String(e));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(email: string, password: string) {
    setError(null);
    const r = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error(`Login failed (${r.status})`);
    await refresh();
  }

  async function register(email: string, password: string, displayName: string) {
    setError(null);
    const r = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!r.ok) throw new Error(`Register failed (${r.status})`);
    await login(email, password);
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, error, refresh, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
