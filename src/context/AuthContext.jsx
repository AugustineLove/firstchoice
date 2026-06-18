'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'https://firstchoice-backend.onrender.com/api';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('fc_token') || null);
  const [refresh, setRefresh] = useState(() => localStorage.getItem('fc_refresh') || null);
  const [loading, setLoading] = useState(true);

  /* ── Persist tokens ── */
  useEffect(() => {
    if (token)   localStorage.setItem('fc_token', token);
    else         localStorage.removeItem('fc_token');
    if (refresh) localStorage.setItem('fc_refresh', refresh);
    else         localStorage.removeItem('fc_refresh');
  }, [token, refresh]);

  /* ── Load user on mount if token exists ── */
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchMe(token);
  }, []);

  async function fetchMe(t) {
    try {
      const res  = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setUser(data.data.user);
      else              logout();
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  /* ── Login ── */
  async function login(phone, password) {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    setToken(data.data.accessToken);
    setRefresh(data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  }

  /* ── Register ── */
  async function register(payload) {
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    setToken(data.data.accessToken);
    setRefresh(data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  }

  /* ── Refresh access token ── */
  const refreshToken = useCallback(async () => {
    if (!refresh) throw new Error('No refresh token');
    const res  = await fetch(`${API}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: refresh }),
    });
    const data = await res.json();
    if (!data.success) { logout(); throw new Error('Session expired'); }
    setToken(data.data.accessToken);
    return data.data.accessToken;
  }, [refresh]);

  /* ── Authenticated fetch wrapper ── */
  const authFetch = useCallback(async (path, options = {}) => {
    let t = token;
    let res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
        ...(options.headers || {}),
      },
    });

    /* Auto-refresh on 401 */
    if (res.status === 401) {
      try {
        t = await refreshToken();
        res = await fetch(`${API}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${t}`,
            ...(options.headers || {}),
          },
        });
      } catch {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }
    return res;
  }, [token, refreshToken]);

  function logout() {
    setUser(null);
    setToken(null);
    setRefresh(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}