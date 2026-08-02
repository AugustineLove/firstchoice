'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initPushNotifications, listenForForegroundMessages } from '../config/firebase';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'https://firstchoice-backend.onrender.com/api';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('fc_token') || null);
  const [refresh, setRefresh] = useState(() => localStorage.getItem('fc_refresh') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token)   localStorage.setItem('fc_token', token);
    else         localStorage.removeItem('fc_token');
    if (refresh) localStorage.setItem('fc_refresh', refresh);
    else         localStorage.removeItem('fc_refresh');
  }, [token, refresh]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchMe(token);
  }, []);

  useEffect(() => {
  if (user) initPushNotifications(authFetch);
  if (user) listenForForegroundMessages();
}, [user]);

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

  /* ── Authenticated fetch wrapper ──
     Skips forcing Content-Type when the body is FormData so the browser
     can set the correct multipart boundary itself. */
  const authFetch = useCallback(async (path, options = {}) => {
    const isFormData = options.body instanceof FormData;

    function buildHeaders(t) {
      const headers = { Authorization: `Bearer ${t}`, ...(options.headers || {}) };
      if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      return headers;
    }

    let t = token;
    let res = await fetch(`${API}${path}`, { ...options, headers: buildHeaders(t) });

    if (res.status === 401) {
      try {
        t = await refreshToken();
        res = await fetch(`${API}${path}`, { ...options, headers: buildHeaders(t) });
      } catch {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }
    return res;
  }, [token, refreshToken]);

  function updateUser(patch) {
    setUser((prev) => (prev ? { ...prev, ...patch } : patch));
  }

  function logout() {
    setUser(null);
    setToken(null);
    setRefresh(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}