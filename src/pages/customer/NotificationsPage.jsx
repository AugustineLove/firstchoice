'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/notifications'); // adjust to your notifications endpoint
      const json = await res.json();
      if (json.success) setItems(json.data.notifications ?? json.data);
    } catch {}
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Notifications</span>
        </div>
      </div>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme.green }} /></div>}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}><Bell size={36} style={{ marginBottom: 10 }} /><div style={{ fontWeight: 700 }}>Nothing yet</div></div>
        )}
        {!loading && items.map((n) => (
          <div key={n.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{n.body}</div>
            <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}