// components/vendor/ui.jsx — shared primitives (fixes the circular imports from VendorDashboardPro)
import { useState, useEffect, useCallback } from 'react';

export const money = n => `GHS ${Number(n || 0).toFixed(2)}`;
export const short = id => id?.slice(-8).toUpperCase();
export const fmt = d => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const dayKey = d => new Date(d).toISOString().slice(0, 10);
export const arr = v => (Array.isArray(v) ? v : []);

export const card = { background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20 };
export const h3 = { fontSize: 14, fontWeight: 800, color: '#0f1117', margin: '0 0 14px' };
export const inputS = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
export const btn = (c, ghost) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${c}`, background: ghost ? '#fff' : c, color: ghost ? c : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 });

const COLORS = {
  PENDING: ['#92400e', '#fef3c7'], ACCEPTED: ['#065f46', '#d1fae5'], PREPARING: ['#1e40af', '#dbeafe'],
  READY_FOR_PICKUP: ['#0369a1', '#e0f2fe'], RIDER_ASSIGNED: ['#5b21b6', '#ede9fe'], PICKED_UP: ['#5b21b6', '#ede9fe'],
  IN_TRANSIT: ['#5b21b6', '#ede9fe'], ARRIVED: ['#5b21b6', '#ede9fe'], DELIVERED: ['#065f46', '#d1fae5'],
  CANCELLED: ['#991b1b', '#fee2e2'], ACTIVE: ['#065f46', '#d1fae5'], INACTIVE: ['#374151', '#f3f4f6'],
};
export function Badge({ status }) {
  const [c, bg] = COLORS[status] || ['#374151', '#f3f4f6'];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, background: bg, color: c, whiteSpace: 'nowrap' }}>{status?.replace(/_/g, ' ')}</span>;
}

export function Stat({ icon, label, value, sub, color }) {
  return (
    <div style={card}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0f1117', letterSpacing: '-1px' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// data: [{ label, value }]. Labels thin out automatically for long series (30/90 days).
export function Bars({ data, color = '#16a34a', fmtVal = v => v }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const step = Math.ceil(data.length / 10);
  const dense = data.length > 16;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: dense ? 2 : 6, height: 160 }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.label || i}: ${fmtVal(d.value)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
          {!dense && <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{d.value ? fmtVal(d.value) : ''}</div>}
          <div style={{ width: '100%', maxWidth: 34, height: `${(d.value / max) * 100}px`, minHeight: 3, background: d.value ? color : '#e5e7eb', borderRadius: 4 }} />
          <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', height: 12 }}>{i % step === 0 ? d.label : ''}</div>
        </div>
      ))}
    </div>
  );
}

export const Empty = ({ text }) => <div style={{ color: '#9ca3af', fontSize: 13, padding: '18px 0', textAlign: 'center' }}>{text}</div>;

// Tiny GET hook: const { data, loading, error, reload } = useGet(authFetch, '/vendors/me/analytics?days=30')
export function useGet(authFetch, path) {
  const [s, set] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(async () => {
    set(p => ({ ...p, loading: true }));
    try {
      const res = await authFetch(path);
      const text = await res.text();
      let j;
      try { j = JSON.parse(text); }
      catch { return set({ data: null, loading: false, error: `Server returned ${res.status} (not JSON) for ${path}` }); }
      set({ data: j.success ? j.data : null, loading: false, error: j.success ? '' : j.message || `Failed (${res.status})` });
    } catch (e) {
      set({ data: null, loading: false, error: `Could not reach the server: ${e.message}` });
    }
  }, [authFetch, path]);
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load };
}

// Pause / resume incoming orders. Put it in the dashboard header.
export function StoreToggle({ vendor, authFetch, onChange, toast }) {
  const on = vendor?.acceptingOrders !== false;
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    try {
      const r = await authFetch('/vendors/me/accepting-orders', { method: 'PATCH', body: JSON.stringify({ accepting: !on }) });
      const j = await r.json();
      if (j.success) { onChange({ ...vendor, acceptingOrders: j.data.acceptingOrders }); toast?.(j.data.acceptingOrders ? 'Store is accepting orders' : 'Orders paused'); }
      else toast?.(j.message || 'Could not update');
    } catch { toast?.('Network error'); }
    setBusy(false);
  }
  return (
    <button onClick={flip} disabled={busy} style={{ ...btn(on ? '#16a34a' : '#dc2626', true), padding: '8px 14px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#16a34a' : '#dc2626' }} />
      {on ? 'Accepting orders' : 'Orders paused'}
    </button>
  );
}